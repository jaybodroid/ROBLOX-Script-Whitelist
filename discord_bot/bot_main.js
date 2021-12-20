/*


██████   ██████  ████████      ███    ███  █████  ██ ███    ██         ██ ███████ 
██   ██ ██    ██    ██         ████  ████ ██   ██ ██ ████   ██         ██ ██      
██████  ██    ██    ██         ██ ████ ██ ███████ ██ ██ ██  ██         ██ ███████ 
██   ██ ██    ██    ██         ██  ██  ██ ██   ██ ██ ██  ██ ██    ██   ██      ██ 
██████   ██████     ██ ███████ ██      ██ ██   ██ ██ ██   ████ ██  █████  ███████ 
                                                                                  
          ██████  ██    ██     ██████  ███    ██ ██    ██ ██   ██ 
          ██   ██  ██  ██      ██   ██ ████   ██  ██  ██   ██ ██  
          ██████    ████       ██████  ██ ██  ██   ████     ███   
          ██   ██    ██        ██      ██  ██ ██    ██     ██ ██  
          ██████     ██        ██      ██   ████    ██    ██   ██ 
                                      
*/

const Discord = require("discord.js");
const client = new Discord.Client();
const ext = require("./external");

const config = ext.loadConfig();
const functions = ext.loadFunctions();
ext.loadCommands();

client.on("message", async (message) => {
    if (message.content.startsWith(config.prefix)) {
        var processedCommand = await functions.parseCommand(message);
        if (processedCommand !== null) {
            if (processedCommand.command.arguments == processedCommand.provided_args.length) {
                if (processedCommand.canRun) {
                    try {
                        processedCommand.command.function(message, processedCommand.provided_args);
                    } catch(Error) {
                        if (Error.indexOf("yourwebsite.com") == -1) {
                            functions.sendResponseEmbed(
                                client.channels.get(config.logs.errors.id),
                                "commandfailure",
                                `An error has occurred whilst <@${message.author.id}> was running the command "${processedCommand["name"]}".\n` + "```" + Error + "```",
                                "Error id: " + functions.createId(),
                            )
                        } else {
                            functions.sendResponseEmbed(
                                client.channels.get(config.logs.errors.id),
                                "commandfailure",
                                `An error has occurred whilst <@${message.author.id}> was running the command "${processedCommand["name"]}".\n` + "```" + "Error information has been blocked due to it possibly containing sensitive information." + "```",
                                "Error id: " + functions.createId(),
                            )
                        }
                    }
                } else {
                    functions.sendResponseEmbed(
                        message.channel,
                        "commandfailure",
                        "Insufficient permissions.",
                        "Command ID: " + functions.createId()
                    )
                }
            } else {
                functions.sendResponseEmbed(
                    message.channel,
                    "commandfailure",
                    "An invalid amount of arguments have been provided, try again.",
                    "Command ID: " + functions.createId()
                )
            }
        } else {
            functions.sendResponseEmbed(
                message.channel,
                "commandfailure",
                "Command not found, a list of commands can be found by using the help command.",
                "Command ID: " + functions.createId()
            )
        }
    }
});

client.login("OTIyMzYxNDMyOTU4NDQ3NjE2.YcAWBg.fQzB36HjczZsgGI_Gr4h25Ng_Ag");
console.clear();
console.info("Activated.")
