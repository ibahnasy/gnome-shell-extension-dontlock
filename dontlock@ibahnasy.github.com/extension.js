import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import Gio from 'gi://Gio';

export default class DisableLockExtension {
    constructor() {
        this._indicator = null;
        this._toggle = null;
        this._lockSettings = null;
        this._sessionSettings = null;

        this._originalIdleDelay = null;
        this._originalLockEnabled = null;

        this._sessionChangedId = null;
        this._lockChangedId = null;
    }

    enable() {
        this._lockSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.screensaver' });
        this._sessionSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.session' });

        // Save current prefs
        this._originalIdleDelay = this._sessionSettings.get_uint('idle-delay');
        this._originalLockEnabled = this._lockSettings.get_boolean('lock-enabled');

        this._indicator = new QuickSettings.SystemIndicator();

        this._toggle = new QuickSettings.QuickToggle({
            title: 'DontLock',
            iconName: 'changes-prevent-symbolic',
            toggleMode: true,
        });
        this._toggle.checked = false;

        this._toggle.connect('notify::checked', (toggle) => {
            if (toggle.checked) {
                // Disable lock + idle
                this._lockSettings.set_boolean('lock-enabled', false);
                this._sessionSettings.set_uint('idle-delay', 0);
            } else {
                // Restore saved values
                this._lockSettings.set_boolean('lock-enabled', this._originalLockEnabled);
                this._sessionSettings.set_uint('idle-delay', this._originalIdleDelay);
            }
        });

        this._indicator.quickSettingsItems.push(this._toggle);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        if (this._toggle) {
            this._toggle.destroy();
            this._toggle = null;
        }

        if (this._lockSettings && this._sessionSettings) {
            // Restore to last known user prefs
            this._lockSettings.set_boolean('lock-enabled', this._originalLockEnabled);
            this._sessionSettings.set_uint('idle-delay', this._originalIdleDelay);
        }

        // Null out
        this._lockSettings = null;
        this._sessionSettings = null;
        this._originalIdleDelay = null;
        this._originalLockEnabled = null;
    }
}
