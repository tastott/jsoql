import repo = require('./typedRepository')

export interface Preferences {
    Theme: string;
}

export class PreferencesService {

    constructor(private prefsRepository: repo.TypedRepository<Preferences>) {

        //Set default preferences if necessary
        if (!prefsRepository.Get()) {
            prefsRepository.Put({
                Theme: 'dark'
            });
        }
    }

    Set(action: (prefs: Preferences) => void) {
        var prefs = this.prefsRepository.Get();
        action(prefs);
        this.prefsRepository.Put(prefs);
    }

    Get(): Preferences {
        return this.prefsRepository.Get();
    }

}