import { Service } from "typedi";
import { electronApp } from "../../src/app";

@Service()
export class AppService {

    public getMainWindow() {
        return electronApp.getMainWindow();
    }

    public onTerminate(fn: () => void) {
        electronApp.onTerminate(fn);
    }

}