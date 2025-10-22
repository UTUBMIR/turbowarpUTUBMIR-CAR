const translations = {
    "ru": {
        "_set car URL to [URL]": "установить URL машины на [URL]",
        "_measure distance": "измерить дистанцию",
        "_drive with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]": "ехать с левой скоростью:[LEFT_SPEED] и правой скоростью:[RIGHT_SPEED]",
        "_drive[SECONDS]seconds with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]": "ехать [SECONDS] секунд с левой скоростью:[LEFT_SPEED] и правой скоростью:[RIGHT_SPEED]",
        "_look in direction:[ANGLE]": "смотреть в направлении:[ANGLE]",
        "_UTUBMIR Car": "UTUBMIR Машина",
        "_distance": "дистанция",
        "_on": "включено",
        "_off": "выключено",
        "_headlights[STATE]": "фары[STATE]",
        "_drive [DISTANCE]cm": "ехать[DISTANCE]см"
    },
    "uk": {
        "_set car URL to [URL]": "встановити URL машини на [URL]",
        "_measure distance": "виміряти дистанцію",
        "_drive with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]": "їхати з лівою швидкістю:[LEFT_SPEED] і правою швидкістю:[RIGHT_SPEED]",
        "_drive[SECONDS]seconds with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]": "їхати [SECONDS] секунд з лівою швидкістю:[LEFT_SPEED] і правою швидкістю:[RIGHT_SPEED]",
        "_look in direction:[ANGLE]": "дивитись у напрямку:[ANGLE]",
        "_UTUBMIR Car": "UTUBMIR Машина",
        "_distance": "дистанція",
        "_on": "увімкнено",
        "_off": "вимкнено",
        "_headlights[STATE]": "фари[STATE]",
        "_drive [DISTANCE]cm": "їхати[DISTANCE]см"
    },
    "nb": {
        "_set car URL to [URL]": "sett bilens URL til [URL]",
        "_measure distance": "mål avstand",
        "_drive with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]": "kjør med venstre hastighet:[LEFT_SPEED] og høyre hastighet:[RIGHT_SPEED]",
        "_drive[SECONDS]seconds with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]": "kjør [SECONDS] sekunder med venstre hastighet:[LEFT_SPEED] og høyre hastighet:[RIGHT_SPEED]",
        "_look in direction:[ANGLE]": "se i retning:[ANGLE]",
        "_UTUBMIR Car": "UTUBMIR Bil",
        "_distance": "avstand",
        "_on": "på",
        "_off": "av",
        "_headlights[STATE]": "lykter[STATE]",
        "_drive [DISTANCE]cm": "kjøre[DISTANCE]cm"
    }
};
Scratch.translate.setup(translations);

(function (Scratch) {
    "use strict";

    // Variable to store the API URL
    let carUrl = "";
    let socket = null;
    let distance = 0;
    let speed = 24.6;

    const reverseLookup = {};

    for (const lang of ["uk", "ru", "no"]) {
        for (const key in translations[lang]) {
            reverseLookup[translations[lang][key]] = key.substring(1);
        }
    }

    function getEnglish(value) {
        return (reverseLookup[value] || value) ?? null;
    }

    async function loadSocketIO() {
        if (window.io) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function connect(url) {
        if (!window.io) throw new Error("Socket.IO не завантажено. Викликай loadSocketIO() спочатку");

        return new Promise((resolve, reject) => {
            socket = io(url + "?ngrok-skip-browser-warning=true", {
                transports: ["websocket"]
            });

            socket.on("connect", () => {
                console.log("✅ Socket connected", socket.id);
                resolve();
            });

            socket.on("disconnect", () => {
                console.log("❌ Socket disconnected");
            });

            socket.on("connect_error", (err) => {
                console.error("⚠️ Socket connection error:", err);
                reject(err);
            });
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    function sendCommand(cmd) {
        if (!socket || !socket.connected) {
            console.error("Socket не підключений");
            return Promise.reject(new Error("Socket не підключений"));
        }

        return new Promise((resolve, reject) => {
            socket.emit("command", cmd, (ack) => {
                if (!ack) reject(new Error("No ACK"));
                else resolve(ack);
            });
        });
    }

    class UTUBMIRCarExtension {
        getInfo() {
            return {
                id: "utubmirCar",
                name: Scratch.translate("UTUBMIR Car"),
                color1: "#007bff",
                blocks: [
                    {
                        opcode: "distance",
                        blockType: Scratch.BlockType.REPORTER,
                        text: Scratch.translate("distance"),
                    },
                    {
                        opcode: "setCarUrl",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("set car URL to [URL]"),
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: carUrl
                            }
                        }
                    },
                    // {
                    //     opcode: "waitUntilDistance",
                    //     blockType: Scratch.BlockType.COMMAND,
                    //     text: Scratch.translate("wait until distance[OPERATOR][DISTANCE]cm"),
                    //     arguments: {
                    //         OPERATOR: {
                    //             type: Scratch.ArgumentType.STRING,
                    //             menu: "operatorStates"
                    //         },
                    //         DISTANCE: {
                    //             type: Scratch.ArgumentType.NUMBER,
                    //             defaultValue: 100
                    //         }
                    //     }
                    // },
                    {
                        opcode: "measureDistance",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("measure distance"),
                    },
                    {
                        opcode: "drive",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("drive with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]"),
                        arguments: {
                            LEFT_SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 90
                            },
                            RIGHT_SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: -90
                            }
                        }
                    },
                    {
                        opcode: "driveWithTimer",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("drive[SECONDS]seconds with left speed:[LEFT_SPEED]and right speed:[RIGHT_SPEED]"),
                        arguments: {
                            SECONDS: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            },
                            LEFT_SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 90
                            },
                            RIGHT_SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: -90
                            }
                        }
                    },
                    {
                        opcode: "driveDistance",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("drive [DISTANCE]cm"),
                        arguments: {
                            DISTANCE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 20
                            }
                        }
                    },
                    {
                        opcode: "look",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("look in direction:[ANGLE]"),
                        arguments: {
                            ANGLE: {
                                type: Scratch.ArgumentType.ANGLE,
                                defaultValue: 0
                            }
                        }
                    },
                    {
                        opcode: "light",
                        blockType: Scratch.BlockType.COMMAND,
                        text: Scratch.translate("headlights[STATE]"),
                        arguments: {
                            STATE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'boolStates'
                            }
                        }
                    }
                ],
                menus: {
                    boolStates: {
                        acceptReporters: true,
                        items: [Scratch.translate("on"), Scratch.translate("off")]
                    },
                    operatorStates: {
                        acceptReporters: true,
                        items: ["<", ">"]
                    }
                }
            };
        }
        distance() {
            return distance;
        }

        async measureDistance() {
            const ack = await sendCommand({ action: "watch" });
            distance = +(ack.distance_cm);
        }

        // async waitUntilDistance({OPERATOR, DISTANCE}) {

        // }


        async drive({ LEFT_SPEED, RIGHT_SPEED }) {
            const left = Math.round(Math.max(-90, Math.min(90, LEFT_SPEED)));
            const right = Math.round(Math.max(-90, Math.min(90, RIGHT_SPEED)));
            await sendCommand({ action: "drive", left, right });
        }

        async driveWithTimer({ SECONDS, LEFT_SPEED, RIGHT_SPEED }) {
            const timer = Math.round(Math.max(0, SECONDS * 1000.0));
            const left = Math.round(Math.max(-90, Math.min(90, LEFT_SPEED)));
            const right = Math.round(Math.max(-90, Math.min(90, RIGHT_SPEED)));

            const start = performance.now();
            await sendCommand({ action: "drive", left, right, timer });
            const end = performance.now();
             
            await delay(timer - (end - start));
        }

        async driveDistance({ DISTANCE }) {
            let left, right;
            if (DISTANCE != 0) {
                if (DISTANCE > 0) {
                    left = 65;
                    right = 90;
                }
                else {
                    left = -65;
                    right = -90;
                }
                let timer = Math.round((Math.abs(DISTANCE) / speed) * 1000.0);
                await sendCommand({ action: "drive", left, right, timer });
                await delay(timer);
            }
        }

        async look({ ANGLE }) {
            const angle = Math.round(Math.max(-90, Math.min(90, ANGLE)));
            await sendCommand({ action: "look", angle });
        }

        async light({ STATE }) {
            const state = getEnglish(STATE);
            await sendCommand({ action: "light", state });
        }

        async setCarUrl({ URL }) {
            if (carUrl != URL || !socket || !socket.connected) {
                carUrl = URL;

                await loadSocketIO();
                await connect(carUrl);
            }
        }
    }

    Scratch.extensions.register(new UTUBMIRCarExtension());
})(Scratch);