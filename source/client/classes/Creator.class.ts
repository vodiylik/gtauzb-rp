import { femaleHairOverlays, genderPreset, maleHairOverlays } from "../assets/Creator.assets";
import Camera from "./Camera.class";
import { Client } from "./Client.class";
import { Utils } from "../../shared/Utils.module";

let taskInterval: NodeJS.Timeout | null = null;

type TCreatorCamera = Record<string, { coords: Vector3; fov: number; zpos: number }>;
type FaceValue = Record<number, keyof RageShared.Interfaces.CreatorFace>;

const creatorData: RageShared.Interfaces.CreatorData = {
    sex: 0,
    name: { firstname: "", lastname: "" },
    parents: {
        father: 0,
        mother: 0,
        leatherMix: 0,
        similarity: 0
    },
    hair: {
        head: 0,
        eyebrows: 0,
        chest: 0,
        beard: 0
    },
    face: {
        noseWidth: 0, // 0
        nosePeakHeight: 0, // 1
        nosePeakLength: 0, // 2
        noseBoneHeight: 0, // 3
        nosePeakLowering: 0, // 4
        noseBoneTwist: 0, // 5
        eyebrowHeight: 0, // 6
        eyebrowForward: 0, // 7
        cheekboneHeight: 0, // 8
        cheekboneWidth: 0, // 9
        cheekWidth: 0, // 10
        eyesWidth: 0, // 11
        lips: 0, // 12
        jawBoneWidth: 0, // 13
        jawBoneBackLength: 0, // 14
        ChimpBoneLowering: 0, // 15
        ChimpBoneLength: 0, // 16
        ChimpBoneWidth: 0, // 17
        ChimpHole: 0, // 18
        neckWidth: 0, // 19
        eyeMakeup: 0,
        faceMakeup: 0,
        lipstickID: 0
    },
    color: {
        head: 0,
        eyebrows: 0,
        eyes: 0,
        chest: 0,
        beard: 0,
        head_secondary: 0,
        eyeMakeup: 0,
        faceMakeup: 0,
        lipstick: 0
    }
};

const faceList: Record<number, number[]> = {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 42, 43, 44],
    1: [21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 45]
};

const creatorCamera: TCreatorCamera = {
    creator_name: { coords: new mp.Vector3(-79.28535461425781, -1409.435791015625, 29.320751190185547), fov: 36, zpos: 0.7000000000000001 },
    creator_appearance: { coords: new mp.Vector3(-79.28535461425781, -1409.435791015625, 29.320751190185547), fov: 36, zpos: 0.7000000000000001 },
    creator_face: { coords: new mp.Vector3(-79.28535461425781, -1409.435791015625, 29.3207511901855478), fov: 45, zpos: 0.7500000000000001 },
    creator_clothes: { coords: new mp.Vector3(-79.28535461425781, -1409.435791015625, 29.320751190185547), fov: 36, zpos: 0.49999999999999994 }
};

class ModelCreator {
    //#region Creator Camera
    category: string = "creator_name";
    player_position: Vector3 = new mp.Vector3(-75.93680572509766, -1410.941162109375, 29.320751190185547 - 1);
    player_heading: number = 87.1931381225586;
    creator_camera = new mp.Vector3(-79.28535461425781, -1409.435791015625, 29.320751190185547);
    z_pos = 0;

    constructor() {
        mp.events.add("client::creator:createCamera", this.setupCamera.bind(this));
        mp.events.add("client::creator:changeCamera", this.changeCategory.bind(this));
        mp.events.add("client::creator:destroycam", this.destroyCamera.bind(this));
        mp.events.add("client::creator:start", this.setupCamera.bind(this));
        mp.events.add("client::creator:random", this.randomizer.bind(this));
        mp.events.add("client::creator:preview", this.previewChanges.bind(this));
    }

    async setupCamera() {
        Camera.destroyCamera("login_camera");
        mp.game.streaming.requestCollisionAtCoord(-79.28535461425781, -1409.435791015625, 29.320751190185547);
        mp.game.streaming.requestAdditionalCollisionAtCoord(-79.28535461425781, -1409.435791015625, 29.320751190185547);
        while (!mp.players.local.hasCollisionLoadedAround()) await Utils.sleep(0);

        mp.players.local.setCoords(-75.93680572509766, -1410.941162109375, 29.320751190185547 - 1, false, false, false, true);
        mp.players.local.heading = 87.1931381225586;
        mp.players.local.clearTasks();

        mp.players.local.freezePosition(true);
        Camera.createCamera("character_creator", this.creator_camera);
        Camera.setCameraRot("character_creator", new mp.Vector3(-10, 0, 180));
        Camera.setCameraFov("character_creator", 36);
        Camera.setCameraLookAt("character_creator", new mp.Vector3(this.player_position.x, this.player_position.y, this.player_position.z + 1));

        await Client.playAnimationEx("mp_character_creation@lineup@male_a", "intro_facial", 9);

        let playerdata = ["player", -1];
        mp.events.call("client::camera:setEntity", [JSON.stringify(playerdata)]);
        Camera.setCameraActive("character_creator", true);
    }

    changeCategory(category: string) {
        this.category = category;
        let { x, y, z } = creatorCamera[category].coords;
        let fov = 36;

        this.z_pos = creatorCamera[category].zpos;

        let currentPos = Camera.getCameraPosition("character_creator");
        let currentRot = Camera.getCameraRotation("character_creator");

        if (!currentPos || !currentRot) return;

        let ratio = mp.game.graphics.getAspectRatio(true);

        if (category === "creator_face") {
            ratio <= 1.4 ? (fov = 60) : (fov = 40);

            const facePosition = mp.players.local.getBoneCoords(12844, 0, 0, 0);

            Camera.startInterpolate("character_creator", currentPos, new mp.Vector3(x, y, z + this.z_pos), currentRot, 10, 1000, 0);
            Camera.setCameraLookAt("character_creator", facePosition);
        } else {
            Camera.startInterpolate("character_creator", currentPos, new mp.Vector3(x, y, z + this.z_pos), currentRot, 36, 1000, 0);
        }
        Camera.setRotationActive(true);
        this.update();
    }

    destroyCamera() {
        Camera.setRotationActive(false);
        Camera.destroyCamera("character_creator");
        if (taskInterval) {
            clearInterval(taskInterval);
            taskInterval = null;
        }
    }
    //#endregion

    //#region Creator

    chosenData: RageShared.Interfaces.CreatorData = {
        ...creatorData
    };
    //selected random customization
    randomizer(data: any) {
        let randomData: RageShared.Interfaces.CreatorData = data;

        try {
            this.chosenData.sex = randomData.sex;

            //Face features
            this.chosenData.face.noseWidth = randomData.face.noseWidth;
            this.chosenData.face.nosePeakHeight = randomData.face.nosePeakHeight;
            this.chosenData.face.nosePeakLength = randomData.face.nosePeakLength;
            this.chosenData.face.noseBoneHeight = randomData.face.noseBoneHeight;
            this.chosenData.face.nosePeakLowering = randomData.face.nosePeakLowering;
            this.chosenData.face.noseBoneTwist = randomData.face.noseBoneTwist;
            this.chosenData.face.eyebrowHeight = randomData.face.eyebrowHeight;
            this.chosenData.face.eyebrowForward = randomData.face.eyebrowForward;
            this.chosenData.face.cheekboneHeight = randomData.face.cheekboneHeight;
            this.chosenData.face.cheekboneWidth = randomData.face.cheekboneWidth;
            this.chosenData.face.cheekWidth = randomData.face.cheekWidth;
            this.chosenData.face.eyesWidth = randomData.face.eyesWidth;
            this.chosenData.face.lips = randomData.face.lips;
            this.chosenData.face.jawBoneWidth = randomData.face.jawBoneWidth;
            this.chosenData.face.jawBoneBackLength = randomData.face.jawBoneBackLength;
            this.chosenData.face.ChimpBoneLowering = randomData.face.ChimpBoneLowering;
            this.chosenData.face.ChimpBoneLength = randomData.face.ChimpBoneLength;
            this.chosenData.face.ChimpBoneWidth = randomData.face.ChimpBoneWidth;
            this.chosenData.face.ChimpHole = randomData.face.ChimpHole;
            this.chosenData.face.neckWidth = randomData.face.neckWidth;

            //Parents
            this.chosenData.parents.father = randomData.parents.father;
            this.chosenData.parents.mother = randomData.parents.mother;
            this.chosenData.parents.leatherMix = randomData.parents.leatherMix;
            this.chosenData.parents.similarity = randomData.parents.similarity;

            //Hair
            this.chosenData.hair.head = randomData.hair.head;
            this.chosenData.hair.eyebrows = randomData.hair.eyebrows;
            this.chosenData.hair.chest = randomData.hair.chest;
            this.chosenData.hair.beard = randomData.hair.beard;

            //Colors
            this.chosenData.color.head = randomData.color.head;
            this.chosenData.color.eyebrows = randomData.color.eyebrows;
            this.chosenData.color.eyes = randomData.color.eyes;
            this.chosenData.color.chest = randomData.color.chest;
            this.chosenData.color.beard = randomData.color.beard;

            this.update();
        } catch (e: unknown) {
            if (e instanceof TypeError) mp.console.logWarning(e.message);
        }
    }

    update() {
        mp.players.local.setHeadBlendData(
            this.chosenData.parents.mother, // Мама
            this.chosenData.parents.father, // Папа
            4, // Смесь лиц
            this.chosenData.parents.mother, // Мама
            this.chosenData.parents.father,
            0, // Родитель
            (this.chosenData.parents.similarity / 100) * -1, // Схожесть с лицами
            (this.chosenData.parents.leatherMix / 100) * -1, // Схожесть с родителями
            0, // Схожесть с ???
            false // Родители?
        );

        if (mp.players.local.model === mp.game.joaat("mp_m_freemode_01")) {
            mp.players.local.addDecorationFromHashes(
                mp.game.gameplay.getHashKey(maleHairOverlays[this.chosenData.hair.head].collection),
                mp.game.gameplay.getHashKey(maleHairOverlays[this.chosenData.hair.head].overlay)
            );
        } else {
            mp.players.local.addDecorationFromHashes(
                mp.game.gameplay.getHashKey(femaleHairOverlays[this.chosenData.hair.head].collection),
                mp.game.gameplay.getHashKey(femaleHairOverlays[this.chosenData.hair.head].overlay)
            );
        }
        mp.players.local.setComponentVariation(2, this.chosenData.hair.head, 0, 0);
        mp.players.local.setHairColor(this.chosenData.color.head, 0);
        mp.players.local.applyHairOverlay();
        try {
            mp.players.local.setHeadOverlay(2, this.chosenData.hair.eyebrows, 1, this.chosenData.color.eyebrows, this.chosenData.color.eyebrows);
            if (this.chosenData.sex == 0) {
                mp.players.local.setHeadOverlay(1, this.chosenData.hair.beard, 1, this.chosenData.color.beard, this.chosenData.color.beard);
                mp.players.local.setHeadOverlay(10, this.chosenData.hair.chest, 1, this.chosenData.color.chest, this.chosenData.color.chest);
            } else {
                mp.players.local.setHeadOverlay(1, this.chosenData.hair.beard, 0, 1, 1);
                mp.players.local.setHeadOverlay(10, this.chosenData.hair.chest, 0, 1, 1);
            }
        } catch (e: unknown) {
            if (e instanceof TypeError) Utils.clientDebug(`setHeadOverlay >> ${JSON.stringify(e.message)}`);
        }
        try {
            mp.players.local.setEyeColor(this.chosenData.color.eyes);

            // mp.events.callRemote( 'server::character:setFaceFeatures', JSON.stringify( this.chosenData.face ) );

            // let index = 0;
            // for ( const [ _key, value ] of Object.entries( this.chosenData.face ) ) {
            //     mp.players.local.setFaceFeature( index, value );
            //     index++;
            // }
            if (this.chosenData.sex === 0) {
                mp.players.local.setComponentVariation(11, 15, 0, 2); // Jacket
                mp.players.local.setComponentVariation(3, 15, 0, 2); // Torso
                mp.players.local.setComponentVariation(8, 57, 0, 2); // undershirt
                mp.players.local.setComponentVariation(4, 21, 0, 2); // Trousers
                mp.players.local.setComponentVariation(6, 34, 0, 2); // Boots
                mp.players.local.clearAllProps();
            }
            if (this.chosenData.sex === 1) {
                mp.players.local.setComponentVariation(11, 15, 0, 2); // Куртка
                mp.players.local.setComponentVariation(3, 15, 0, 2); // Торс
                mp.players.local.setComponentVariation(8, -1, 0, 2); // undershirt
                mp.players.local.setComponentVariation(4, 15, 0, 2); // Штаны
                mp.players.local.setComponentVariation(6, 35, 0, 2); // Ботинки
                mp.players.local.clearAllProps();
            }
        } catch (e: unknown) {
            if (e instanceof TypeError) Utils.clientDebug(`Other stuff >> ${JSON.stringify(e.message)}`);
        }
    }

    resetData() {
        this.chosenData = { ...creatorData };
        this.update();
    }
    async previewChanges(category: string, ...args: any) {
        let [firstData, secondData, thirdData] = args;

        if (typeof firstData === "undefined") return;

        switch (category) {
            case "sex": {
                let sex = firstData === 0 ? "mp_m_freemode_01" : "mp_f_freemode_01";
                if (mp.players.local.model === mp.game.joaat(sex)) return;

                let data = genderPreset[firstData];
                await Client.requestModel(mp.game.joaat(sex));

                let randomMother = mp.game.misc.getRandomIntInRange(0, faceList[firstData].length - 1);
                let randomFather = mp.game.misc.getRandomIntInRange(0, faceList[firstData].length - 1);

                mp.players.local.model = mp.game.joaat(sex);
                // mp.players.local.taskPlayAnim('mp_character_creation@lineup@female_b', 'intro_facial', 8, -8, -1, 9, 0.0, false, false, false);
                // mp.players.local.taskPlayAnim('mp_character_creation@lineup@male_a', 'intro_facial', 8, -8, -1, 9, 0.0, false, false, false);

                Client.playAnimationEx(sex === "mp_f_freemode_01" ? "mp_character_creation@lineup@female_b" : "mp_character_creation@lineup@male_a", "intro_facial", 9);

                this.chosenData.sex = firstData;

                this.chosenData.parents.mother = faceList[firstData][randomMother];
                this.chosenData.parents.father = faceList[firstData][randomFather];

                this.chosenData.parents.similarity = data.parents[0];
                this.chosenData.parents.leatherMix = data.parents[1];
                this.chosenData.hair.eyebrows = data.hair[1];
                this.update();
                return;
            }

            case "hair": {
                if (typeof secondData === "undefined") return;
                if (firstData === 0) {
                    //hair style
                    this.chosenData.hair.head = secondData;
                } else if (firstData === 1) {
                    //eyebrows
                    this.chosenData.hair.eyebrows = secondData;
                } else if (firstData === 2) {
                    this.chosenData.hair.chest = secondData;
                } else if (firstData === 3) {
                    //beard
                    this.chosenData.hair.beard = secondData;
                }
                this.update();
                break;
            }
            case "color": {
                if (typeof secondData === "undefined") return;
                if (firstData === 0) {
                    //hair color
                    this.chosenData.color.head = secondData;
                } else if (firstData === 1) {
                    //eyebrow color
                    this.chosenData.color.eyebrows = secondData;
                } else if (firstData === 2) {
                    //eye color
                    this.chosenData.color.eyes = secondData;
                } else if (firstData === 3) {
                    //chest color
                    this.chosenData.color.chest = secondData;
                } else if (firstData === 4) {
                    //beard color
                    this.chosenData.color.beard = secondData;
                }
                this.update();
                break;
            }
            case "parents": {
                if (typeof secondData === "undefined") return;
                if (firstData === 0) {
                    this.chosenData.parents.father = secondData;
                } else if (firstData === 1) {
                    this.chosenData.parents.mother = secondData;
                } else if (firstData === 2) {
                    this.chosenData.parents.leatherMix = secondData;
                } else if (firstData === 3) {
                    this.chosenData.parents.similarity = secondData;
                }
                this.update();
                return;
            }
            case "face": {
                // let faceData = this.chosenData.face as { [ key: number ]: number };
                if (typeof firstData === "undefined" || typeof secondData === "undefined") return;

                // faceData[ firstData ] = secondData;

                const faceFeatures: FaceValue = {
                    0: "noseWidth",
                    1: "nosePeakHeight",
                    2: "nosePeakLength",
                    3: "noseBoneHeight",
                    4: "nosePeakLowering",
                    5: "noseBoneTwist",
                    6: "eyebrowHeight",
                    7: "eyebrowForward",
                    8: "cheekboneHeight",
                    9: "cheekboneWidth",
                    10: "cheekWidth",
                    11: "eyesWidth",
                    12: "lips",
                    13: "jawBoneWidth",
                    14: "jawBoneBackLength",
                    15: "ChimpBoneLowering",
                    16: "ChimpBoneLength",
                    17: "ChimpBoneWidth",
                    18: "ChimpHole",
                    19: "neckWidth"
                };
                this.chosenData.face[faceFeatures[firstData]] = secondData;
                mp.players.local.setFaceFeature(firstData, secondData / 100);
                return;
            }
            default:
                return;
        }

        // else dataNew[ name ][ dataSkin[ name ][ firstData ] ] = secondData;
    }
    //#endregion
}

new ModelCreator();
