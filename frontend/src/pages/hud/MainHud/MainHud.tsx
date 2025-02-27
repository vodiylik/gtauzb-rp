import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";

import HudStore from "store/Hud.store";
import PlayerStore from "store/Player.store";
import Speedometer from "./components/Speedometer";
import style from "./mainhud.module.scss";

import star from "assets/images/hud/icons/star.svg";
import ping from "assets/images/hud/icons/ping.svg";
import users from "assets/images/hud/icons/user.svg";
import ammoicon from "assets/images/hud/icons/ammo.svg";
import { entries } from "mobx";

const MainHUD: FC<{ store: HudStore; playerStore: PlayerStore }> = ({ store, playerStore }) => {
    return (
        <div className={style.mainhud}>
            <div className={style.servername}>
                RAGEMP<span style={{ color: "red" }}>ROLEPLAY</span>
            </div>
            <div className={style.playerInfo}>
                <div className={style.id}>ID: {playerStore.data.id}</div>
                <div className={style.ping}>
                    <img src={ping} alt="" />
                    {playerStore.data.ping}
                </div>
                <div className={style.online}>
                    <img src={users} alt="" />
                    {playerStore.nowPlaying}
                </div>
            </div>

            {playerStore.data.wantedLevel > 0 && (
                <div className={style.stars}>
                    {Array.from({ length: playerStore.data.wantedLevel }).map((_e, x) => {
                        return <img src={star} alt="star" key={x} />;
                    })}
                </div>
            )}

            {playerStore.data.weapondata && (
                <div className={style.weaponInfo}>
                    <img src={require(`../../../assets/images/hud/weapons/${playerStore.data.weapondata.weapon}.svg`)} alt="" />
                    <span className={style.ammodata}>
                        <img src={ammoicon} alt="ammo" />
                        {playerStore.data.weapondata.ammo}/{playerStore.data.weapondata.maxammo}
                    </span>
                </div>
            )}

            <div className={style.keybindGuide}>
                {entries(playerStore.keybindGuide).map(([x, val], e) => {
                    return (
                        <div key={e} className={style.keybind}>
                            <span className={style.key}>{x}</span>
                            {val}
                        </div>
                    );
                })}
            </div>

            {store.vehicleData.isActive && (
                <div className={style.speedo}>
                    <Speedometer store={store} />
                </div>
            )}
        </div>
    );
};

export default observer(MainHUD);
