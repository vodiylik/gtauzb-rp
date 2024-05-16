//---------------------------------------//
import { MainDataSource } from "./database/Database.module";
//---------------------------------------//
import "./commands";
//---------------------------------------//
import "./prototype/Player.prototype";
//---------------------------------------//
import "./serverevents/Auth.event";
import "./serverevents/Chat.event";
import "./serverevents/Server.event";
import "./serverevents/Character.event";
//---------------------------------------//
import "./modules/spectate.server";
import { RAGERP } from "./api";
//---------------------------------------//
async function initGamemode() {
    mp.events.delayInitialization = true;
    await MainDataSource.initialize()
        .then(() => console.log("Database connected!"))
        .catch((err) => console.error(err));

    mp.events.delayInitialization = false;
}
(async () => {
    await initGamemode().then(() => console.log("[SHROX FRAMEWORK] Gamemode Initialized"));
})();

console.log(RageEnums.VehicleNumberPlateType.BLUE_WHITE);
