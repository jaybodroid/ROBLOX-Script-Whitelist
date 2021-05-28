/*


███████ ██   ██ ████████ ███████ ██████  ███    ██  █████  ██              ██ ███████ 
██       ██ ██     ██    ██      ██   ██ ████   ██ ██   ██ ██              ██ ██      
█████     ███      ██    █████   ██████  ██ ██  ██ ███████ ██              ██ ███████ 
██       ██ ██     ██    ██      ██   ██ ██  ██ ██ ██   ██ ██         ██   ██      ██ 
███████ ██   ██    ██    ███████ ██   ██ ██   ████ ██   ██ ███████ ██  █████  ███████ 
                                                                                      

            ██████  ██    ██     ██████  ███    ██ ██    ██ ██   ██ 
            ██   ██  ██  ██      ██   ██ ████   ██  ██  ██   ██ ██  
            ██████    ████       ██████  ██ ██  ██   ████     ███   
            ██   ██    ██        ██      ██  ██ ██    ██     ██ ██  
            ██████     ██        ██      ██   ████    ██    ██   ██ 
                                                                    

*/

const fetch = require("node-fetch");

const config = {
    "prefix" : "jumpd@",
    "logs" : {
        "commands" : {
            "id" : "831265140803633183",
            "enabled" : true
        },
        "errors" : {
            "id" : "831265117521313864",
            "enabled" : true
        }
    }
}

const functions = {
    "checkWhitelist": (identifier, value) => {
        return new Promise((Resolve) => {
            fetch("https://yourwebsite.com/api/whitelist_control.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "action": "checkWhitelist",
                    "type": identifier,
                    "input": value
                })
            }).then((Response) => {
                if (Response.status == 200) {
                    Response.json().then((Response) => {
                        if (Response["Status"] == "fail") {
                            Resolve(false);
                        } else {
                            Resolve(Response);
                        }
                    })
                }
            })
        })
    },
    "createId": () => {
        return ("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(x) {
            var r = 16 * Math.random() | 0;
            return ("x" == x ? r : 3 & r | 8).toString(16)
        }))
    },
    "sendResponseEmbed": (sendto, type, description, footer) => {
        return new Promise((Resolve) => {
            try {
                sendto.send({
                    embed: {
                        title: "Jump'd Bot",
                        color: (() => {
                            switch (type !== undefined) {
                                case type == "commandsuccess":
                                    return 3066993;
                                case type == "commandfailure":
                                    return 15158332;
                                case type == "directmessage":
                                    return 2895667;
                                default:
                                    throw new Error("A response type was not provided.");
                            }
                        })(),
                        description: (() => {
                            return description ?? (() => {
                                throw new Error("A description was not provided.");
                            })();
                        })(),
                        footer: {
                            text: footer ?? (() => {
                                throw new Error("A footer was not provided.");
                            })()
                        }
                    }
                }).then((Message) => {
                    Resolve(Message);
                })
            } catch (Error) {
                console.log("[ Caught Error ] - " + Error);
            }
        })
    },
    "parseCommand": (message_obj) => {
        let message_text = message_obj.content;
        return new Promise(async (Resolve) => {
            if (message_text.startsWith(config.prefix)) {
                await commands.forEach((command) => {
                    if (message_text.startsWith(config.prefix + command.name)) {
                        Resolve({
                            "command": command,
                            "provided_args": (() => {
                                var Arguments = ((message_text.replace(config.prefix + command.name, "")).split(" "))
                                var FilteredArguments = [];
                                Arguments.forEach((Argument) => {
                                    if (Argument !== "") {
                                        FilteredArguments.push(Argument);
                                    }
                                })
                                return FilteredArguments;
                            })(),
                            "canRun": (() => {
                                if (command.roleRequirement !== null) {
                                    if (message_obj.member.roles.cache.some(role => role.id == command.roleRequirement)) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                } else {
                                    return true;
                                }
                            })()
                        });
                    }
                })
                Resolve(null);
            } else {
                Resolve(null);
            }
        })
    },
    "logCommand": (description, commandid, message_obj) => {
        return new Promise((Resolve) => {
            if (config.logs.commands.enabled) {
                message_obj.guild.channels.cache.get(config.logs.commands.id).send({
                    embed: {
                        title: "Command Log",
                        color: 3066993,
                        description: description,
                        footer: {
                            text: "Command ID: " + commandid
                        }
                    }
                }).then(() => {
                    Resolve();
                })
            }
        })
    }
}

const commands = [
    {
        "name": "help",
        "arguments": 0,
        "roleRequirement": null,
        "function": (message) => {
            message.channel.send({
                embed: {
                    title: "Jump'd Bot",
                    color: 3066993,
                    description: "Jump'd Bot's commands:",
                    fields: [{
                            "name": "Moderation",
                            "value": "ban <@member>\nkick <@member>\nmute <@member>\nunmute <@member>\npurge <number>",
                            "inline": true
                        },
                        {
                            "name": "Whitelist Management",
                            "value": "whitelist <@member> <HWID>\nblacklist <@member>\nunblacklist <@member>\ngethwid <@member>\ngetdiscord \<HWID>\ncheckwhitelist <@member>\nchangehwid <@member> <new HWID>\nchangediscord <@member> <@newmember>",
                            "inline": true
                        },
                    ],
                    footer: {
                        text: "Command ID: " + functions.createId()
                    }
                }
            });
        }
    },

    {
        "name": "ban",
        "arguments": 1,
        "roleRequirement": 830755300440932402,
        "function": (message, args) => {
            let ID = functions.createId();
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let DiscordIdentifier = Mentioned.id;
                functions.sendResponseEmbed(
                    Mentioned,
                    "directmessage",
                    "You have been banned from Jump'd by " + message.author.tag + ".",
                    "Punishment ID: " + ID
                ).then(() => {
                    Mentioned.ban().then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "Successfully banned user!",
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has banned <@${DiscordIdentifier}>.`, ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    })
                })
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "Invalid amount of members were mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "kick",
        "arguments": 1,
        "roleRequirement": 830755300440932402,
        "function": (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let DiscordIdentifier = Mentioned.id 
                functions.sendResponseEmbed(
                    Mentioned,
                    "directmessage",
                    "You have been kicked from Jump'd by " + message.author.tag + ".",
                    "Punishment ID: " + ID
                ).then(() => {
                    Mentioned.kick().then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "Successfully kicked user!",
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has kicked <@${DiscordIdentifier}>.`, ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    })
                })
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "Invalid amount of members were mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "mute",
        "arguments": 1,
        "roleRequirement": 830755300440932402,
        "function": (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let MutedRole = message.guild.roles.cache.find(r => r.id == 830757873356505108);
                functions.sendResponseEmbed(
                    Mentioned,
                    "directmessage",
                    "You have been muted by " + message.author.tag + ".",
                    "Punishment ID: " + ID
                ).then(() => {
                    Mentioned.roles.add(MutedRole).then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "Successfully muted user!",
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has muted <@${Mentioned.id}>.`, ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    });
                })
            } else {
                message.channel.send({
                    embed: {
                        title: "Jump'd Bot",
                        color: 15158332,
                        description: "Invalid amount of members were mentioned.",
                        footer: {
                            text: "Command ID: " + functions.createId()
                        }
                    }
                });
            }
        }
    },
    {
        "name": "unmute",
        "arguments": 1,
        "roleRequirement": 830755300440932402,
        "function": (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let MutedRole = message.guild.roles.cache.find(r => r.id == 830757873356505108);
                if (Mentioned.roles.cache.some(role => role.id == 830757873356505108)) {
                    functions.sendResponseEmbed(
                        Mentioned,
                        "directmessage",
                        "You have been unmuted by " + message.author.tag + ".",
                        "Punishment Removal ID: " + ID
                    ).then(() => {
                        Mentioned.roles.remove(MutedRole).then(() => {
                            functions.sendResponseEmbed(
                                message.channel,
                                "commandsuccess",
                                "Successfully unmuted user!",
                                "Command ID: " + ID
                            ).then((Message) => {
                                functions.logCommand(`<@${message.author.id}> has unmuted <@${Mentioned.id}>.`, ID, Message).then(() => {
                                    setTimeout(() => {
                                        Message.delete();
                                    }, 10000)
                                })
                            })
                        });
                    })
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "Invalid amount of members were mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "purge",
        "arguments": 1,
        "roleRequirement": 830755300440932402,
        "function": (message, args) => {
            let ID = functions.createId()
            let Amount = Number(args[0]);

            message.channel.bulkDelete(Amount).then(() => {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandsuccess",
                    "Deleted " + String(Amount) + " messages.",
                    "Command ID: " + ID
                ).then((Message) => {
                    functions.logCommand(`<@${message.author.id}> has purged ${Amount} messages.`, ID, Message).then(() => {
                        setTimeout(() => {
                            Message.delete();
                        }, 10000)
                    })
                })
            })
        }
    },

    {
        "name": "whitelist",
        "arguments": 2,
        "roleRequirement": 830755343763374142,
        "function": (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                try {
                    fetch("https://yourwebsite.com/api/whitelist_control.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "action": "modifyWhitelist",
                            "type": "addtowhitelist",
                            "input": {
                                "HWID": args[1],
                                "Discord": Mentioned.id
                            }
                        })
                    }).then((Response) => {
                        if (Response.status == 200) {
                            Response.json().then((Response) => {
                                functions.sendResponseEmbed(
                                    message.channel,
                                    "commandsuccess",
                                    "Successfully completed request, got response: `" + Response["Response"] + "`",
                                    "Command ID: " + ID
                                ).then((Message) => {
                                    functions.logCommand(`<@${message.author.id}> has whitelisted <@${Mentioned.id}>.`, ID, Message).then(() => {
                                        setTimeout(() => {
                                            Message.delete();
                                        }, 10000)
                                    })
                                })
                            })
                        } else {
                            functions.sendResponseEmbed(
                                message.channel,
                                "commandfailure",
                                "Something went wrong on the server-side, try again or check the logs for an error.",
                                "Command ID: " + ID
                            )
                        }
                    })
                } catch (error) {
                    console.warn("[ Caught Error ] - " + error);
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "Invalid amount of members were mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "blacklist",
        "arguments": 1,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId();
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let Check = await functions.checkWhitelist("Discord", Mentioned.id)
                if (Check !== null) {
                    fetch("https://yourwebsite.com/api/whitelist_control.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            "action": "modifyWhitelist",
                            "type": "blacklist",
                            "input": Check["Response"]["HWID"]
                        })
                    }).then((Response) => {
                        if (Response.status == 200) {
                            Response.json().then((Response) => {
                                if (Response["Status"] == "success") {
                                    functions.sendResponseEmbed(
                                        message.channel,
                                        "commandsuccess",
                                        "Successfully completed request, got response: `" + Response["Response"] + "`",
                                        "Command ID: " + ID
                                    ).then((Message) => {
                                        functions.logCommand(`<@${message.author.id}> has blacklisted <@${Mentioned.id}>.`, ID, Message).then(() => {
                                            setTimeout(() => {
                                                Message.delete();
                                            }, 10000)
                                        })
                                    })
                                } else {
                                    functions.sendResponseEmbed(
                                        message.channel,
                                        "commandfailure",
                                        "Request failure, got response from server: `" + Response["Response"] + "`",
                                        "Command ID: " + ID
                                    )
                                }
                            })
                        } else {
                            functions.sendResponseEmbed(
                                message.channel,
                                "commandfailure",
                                "Request failure, no response recieved from the server.",
                                "Command ID: " + ID
                            )
                        }
                    })
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        "Request failure, the mentioned user is not whitelisted.",
                        "Command ID: " + ID
                    )
                }
            }
        }
    },
    {
        "name": "unblacklist",
        "arguments": 1,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let Check = await functions.checkWhitelist("Discord", Mentioned.id)
                if (Check !== null) {
                    fetch("https://yourwebsite.com/api/whitelist_control.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            "action": "modifyWhitelist",
                            "type": "unblacklist",
                            "input": Check["Response"]["HWID"]
                        })
                    }).then((Response) => {
                        if (Response.status == 200) {
                            Response.json().then((Response) => {
                                if (Response["Status"] == "success") {
                                    functions.sendResponseEmbed(
                                        message.channel,
                                        "commandsuccess",
                                        "Successfully completed request, got response: `" + Response["Response"] + "`",
                                        "Command ID: " + ID
                                    ).then((Message) => {
                                        functions.logCommand(`<@${message.author.id}> has unblacklisted <@${Mentioned.id}>.`, ID, Message).then(() => {
                                            setTimeout(() => {
                                                Message.delete();
                                            }, 10000)
                                        })
                                    })
                                } else {
                                    functions.sendResponseEmbed(
                                        message.channel,
                                        "commandfailure",
                                        "Request failure, got response from server: `" + Response["Response"] + "`",
                                        "Command ID: " + ID
                                    )
                                }
                            })
                        } else {
                            functions.sendResponseEmbed(
                                message.channel,
                                "commandfailure",
                                "Request failure, no response recieved from the server.",
                                "Command ID: " + ID
                            )
                        }
                    })
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        "Request failure, the mentioned user is not whitelisted.",
                        "Command ID: " + ID
                    )
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "An invalid amount of users have been mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "gethwid",
        "arguments": 1,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let Check = await functions.checkWhitelist("Discord", Mentioned.id);
                if (Check !== null) {
                    functions.sendResponseEmbed(
                        message.author,
                        "directmessage",
                        `<@${Mentioned.id}>'s hardware-id is: \`\ ${Check["Response"]["HWID"]} \`\.`,
                        "Command ID: " + ID
                    ).then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            `I sent <@${Mentioned.id}>'s hardware-id to you, <@${message.author.id}>.`,
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has requested the hardware-id that belongs to <@${Mentioned.id}>.`, ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    })
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        `There was an error whilst retrieving <@${Mentioned.id}>'s hardware-id.`,
                        "Command ID: " + ID
                    )
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "An invalid amount of users have been mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "getdiscord",
        "arguments": 1,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId()
            let Check = await functions.checkWhitelist("HWID", args[0]);
            if (Check !== false) {
                if (Check["Response"]["Discord"] != null) {
                    functions.sendResponseEmbed(
                        message.author,
                        "directmessage",
                        `The hardware-id:\n ` + "`" + args[0] + "`" + ` \n\nbelongs to <@${Check["Response"]["Discord"]}>`,
                        "Command ID: " + ID
                    ).then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            `The discord that belongs to the hardware-id you provided has been sent to your dms, <@${message.author.id}>`,
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has requested to retrieve the discord that belongs to the hwid ` + "`" + args[0] + "`.", ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    })
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        `A discord account is not linked to the hardware-id you have sent, <@${message.author.id}>.`,
                        "Command ID: " + ID
                    )
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    `There was an error whilst retrieving the discord that belogs to that hardware-id, <@${message.author.id}>`,
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "changehwid",
        "arguments": 2,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size == 1) {
                let Mentioned = message.mentions.members.first();
                let Check = await functions.checkWhitelist("Discord", Mentioned.id);
                if (Check !== null) {
                    let currentHWID = Check["Response"]["HWID"];
                    fetch("https://yourwebsite.com/api/whitelist_control.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "action": "modifyWhitelist",
                            "type": "changehwid",
                            "input": {
                                "HWID": currentHWID,
                                "NewHWID": args[1]
                            }
                        })
                    }).then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "Successfully changed hardware-id.",
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has changed <@${Mentioned.id}>'s whitelisted hardware-id to \n `+"```" + args[1] + "```", ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    })
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        "There was an error while fetching data for the provided hardware-id.",
                        "Command ID: " + ID
                    )
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "An invalid amount of users were mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "changediscord",
        "arguments": 2,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size >= 1 && message.mentions.members.size < 3) {
                let Mentioned = message.mentions.members.first();
                let Check = await functions.checkWhitelist("Discord", Mentioned.id);
                if (Check !== false) {
                    fetch("https://yourwebsite.com/api/whitelist_control.php", {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                        },
                        body: JSON.stringify({
                            "action": "modifyWhitelist",
                            "type": "changediscordid",
                            "input": {
                                "HWID": Check["Response"]["HWID"],
                                "NewDiscordID": (() => {
                                    let NewID = args[1];
                                    NewID = NewID.split("<@").join("");
                                    NewID = NewID.split("!").join("");
                                    NewID = NewID.split(">").join("");
                                    return NewID;
                                })()
                            }
                        })
                    }).then(() => {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "Successfully changed discord account.",
                            "Command ID: " + ID
                        ).then((Message) => {
                            functions.logCommand(`<@${message.author.id}> has changed <@${Mentioned.id}>'s whitelisted discord to ${args[1]}.`, ID, Message).then(() => {
                                setTimeout(() => {
                                    Message.delete();
                                }, 10000)
                            })
                        })
                    })
                } else {
                    if (Check == false) { 
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandfailure",
                            "The user you have mentioned is not whitelisted. " + Mentioned.id,
                            "Command ID: " + ID
                        )
                    } else {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandfailure",
                            "There was an error while fetching data for the provided user's whitelist.",
                            "Command ID: " + ID
                        )
                    }
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "An invalid amount of users were mentioned.",
                    "Command ID: " + ID
                )
            }
        }
    },
    {
        "name": "checkwhitelist",
        "arguments": 1,
        "roleRequirement": 830755343763374142,
        "function": async (message, args) => {
            let ID = functions.createId()
            if (message.mentions.members.size >= 1 && message.mentions.members.size < 3) {
                let Mentioned = message.mentions.members.first();
                let Check = await functions.checkWhitelist("Discord", Mentioned.id);
                if (Check !== false) {
                    if (!Check["Response"].Blacklisted) {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "User is whitelisted.",
                            "Command ID: " + ID
                        )
                    } else {
                        functions.sendResponseEmbed(
                            message.channel,
                            "commandsuccess",
                            "User is blacklisted.",
                            "Command ID: " + ID
                        )
                    }
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        "User could not be found in whitelist database.",
                        "Command ID: " + ID
                    )
                }
            }
        }
    }
]

var loadConfig = () => { return config; }

var loadFunctions = () => { return functions; }

var loadCommands = () => { return commands; }

module.exports = { loadConfig, loadFunctions, loadCommands };
