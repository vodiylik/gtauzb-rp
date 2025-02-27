import { Utils } from "../../shared/Utils.module";
import { CEFPages } from "../assets/CEFPages.asset";

const disabledControls = [
    0, 30, 31, 21, 36, 22, 44, 38, 71, 72, 59, 60, 42, 43, 85, 86, 75, 15, 14, 228, 37, 229, 348, 156, 199, 204, 172, 173, 37, 199, 44, 178, 244, 220, 221, 218, 219, 16, 17, 200, 202, 322
];

class Browser {
    private readonly url: string = "http://package2/build/index.html";
    mainUI: BrowserMp;
    currentPage: string | undefined;

    constructor() {
        mp.console.logWarning("Browser initialized!");

        mp.gui.chat.show(false);

        this.mainUI = mp.browsers.new(this.url);
        this.mainUI.markAsChat();
        this.currentPage = undefined;
        mp.gui.chat.activate(true);
        this.processEvent('cef::chat:setActive', true);

        mp.events.add("client::eventManager::emitServer", this.emitServer.bind(this));
        mp.events.add("client::eventManager::emitClient", this.emitClient.bind(this));
        mp.events.add("client::eventManager", this.processEvent.bind(this));

        mp.events.add("client::cef:start", this.startPage.bind(this));
        mp.events.add("client::cef:close", this.closePage.bind(this));

        mp.events.add("render", this.onTick.bind(this));
    }

    onTick() {
        mp.game.controls.applyDisableControlActionBatch();
    }

    activate(toggle: boolean): boolean {
        if (!this.mainUI) return false;
        this.mainUI.active = toggle;
        return this.mainUI.active;
    }

    processEvent(eventName: string, ...args: any): void {
        if (!eventName || !this.mainUI) return;
        if (eventName === "cef::system:setPage") {
            this.startPage(args[0]);
        }
        if (this.mainUI && eventName.indexOf("cef::") != -1) {
            let event = eventName.split("cef::")[1];

            const argsString = args.map((arg: any) => JSON.stringify(arg)).join(", ");

            const script = `
                window.callHandler("${event}", ${argsString})
            `;
            this.mainUI.execute(script);
            // this.mainUI.call("cef::eventManager", event, ...args);
        } else return mp.console.logWarning("Error calling event: " + eventName + " it does not exists.");
    }

    closePage(): void {
        if (!this.mainUI || !mp.browsers.exists(this.mainUI)) return;
        const page = this.currentPage;
        if (!page) return;

        const pageData = CEFPages[page];
        this.currentPage = undefined;

        mp.events.callRemote("server::player:closeCEF", page);
        if (pageData.blur) {
            mp.game.graphics.transitionFromBlurred(1);
        }

        mp.game.ui.displayRadar(true);
        mp.gui.cursor.show(false, false);

        mp.game.controls.setDisableControlActionBatch(false, []);
        mp.players.local.freezePosition(false);

        if (this.mainUI && mp.browsers.exists(this.mainUI)) {
            this.mainUI.call("cef::eventManager", "system:setPage", "hud");
        }
    }

    startPage(pageName: string): void {
        const params = CEFPages[pageName];

        if (typeof params.radar !== "undefined") mp.game.ui.displayRadar(params.radar);
        if (params.controls) mp.game.controls.setDisableControlActionBatch(false, disabledControls);
        if (params.freezeCamera) mp.players.local.freezePosition(params.freezeCamera);
        mp.gui.cursor.show(true, true);

        setTimeout(() => {
            if (params.blur) {
                mp.game.graphics.transitionToBlurred(1);
            } else mp.game.graphics.transitionFromBlurred(1);
        }, 100);

        this.currentPage = pageName;
        mp.events.callRemote("server::player:setCefPage", pageName);
    }

    emitServer(receivedData: any): void {
        let data = Utils.tryParse(receivedData);
        let { event, args } = data;
        Array.isArray(args) ? (args.length === 1 ? mp.events.callRemote(event, JSON.stringify(args[0])) : mp.events.callRemote(event, JSON.stringify(args))) : mp.events.callRemote(event, args);
        Utils.clientDebug(`[SERVER EMIT]: "${event.split(":")[2]}", "${event.split(":")[3]}" -> ${JSON.stringify(args)}`);
    }

    emitClient(receivedData: any): void {
        let data = Utils.tryParse(receivedData);
        let { event, args } = data;
        if (Array.isArray(args)) {
            mp.events.call(event, ...args);
        } else {
            mp.events.call(event, args);
        }
        Utils.clientDebug("[CLIENT EMIT]: " + event + " " + JSON.stringify(args));
    }

    blockPage(pagename: string, block: boolean) {}
}

export default new Browser();
