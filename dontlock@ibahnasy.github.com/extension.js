import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import Gio from 'gi://Gio';

export default class DisableLockExtension {
    constructor() {
        this._indicator = null;
        this._toggle = null;

        // Settings objects
        this._lockSettings = new Gio.Settings({ schema: 'org.gnome.desktop.screensaver' });
        this._sessionSettings = new Gio.Settings({ schema: 'org.gnome.desktop.session' });

        // Save user’s idle-delay so we can restore it later
        this._originalIdleDelay = this._sessionSettings.get_uint('idle-delay');
    }

    enable() {
        this._indicator = new QuickSettings.SystemIndicator();

        // Always reset to OFF on startup
        this._lockSettings.set_boolean('lock-enabled', true);
        this._sessionSettings.set_uint('idle-delay', this._originalIdleDelay);

        this._toggle = new QuickSettings.QuickToggle({
            title: 'DontLock',
            iconName: 'changes-prevent-symbolic',
            toggleMode: true,
        });

        this._toggle.checked = false;

        this._toggle.connect('notify::checked', (toggle) => {
            if (toggle.checked) {
                // Disable lock + prevent idle
                this._lockSettings.set_boolean('lock-enabled', false);
                this._sessionSettings.set_uint('idle-delay', 0);
            } else {
                // Restore defaults
                this._lockSettings.set_boolean('lock-enabled', true);
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
        this._toggle = null;

        // Restore defaults
        this._lockSettings.set_boolean('lock-enabled', true);
        this._sessionSettings.set_uint('idle-delay', this._originalIdleDelay);
    }
}
