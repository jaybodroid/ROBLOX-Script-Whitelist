const fs = require("fs");
const fetch = require("node-fetch");
const express = require('express');
const sha256 = require('sha256');
const app = express()
const port = 1337

var ActiveSessions = [];
var CooldownIPs = [];
var PreviousHashes = [];

function getContents(file_name) {
    return new Promise((Resolve) => {
        fs.readFile(file_name, function(err, text) {
            Resolve(text.toString());
        });
    })
}

function getURLContents(url, type) {
    return new Promise((Resolve) => {
        if (type == "text") {
            fetch(url).then(r => r.text().then((text) => {
                Resolve(text);
            }))
        } else if (type == "json") {
            fetch(url).then(r => r.json().then((json) => {
                Resolve(json);
            }))
        }
    })
}

async function checkWhitelist(HWID) {
    var WhitelistFile;
    return new Promise(async (Resolve) => {
        WhitelistFile = await getURLContents("https://yourwebsite.com/yourwhitelistfolder/whitelist.json", "json");
        await WhitelistFile.forEach((authNode) => {
            if (authNode.HWID == HWID) {
                if (authNode.Blacklisted) {
                    Resolve({
                        "Status": false,
                        "Reason": "Blacklisted",
                        "FullList": WhitelistFile,
                        "Object": authNode
                    });
                } else {
                    Resolve({
                        "Status": true,
                        "Reason": "Whitelisted",
                        "FullList": WhitelistFile,
                        "Object": authNode
                    });
                }
            }
        })
        Resolve({
            "Status": false,
            "Reason": "Not found",
            "Object": null
        });
    })
}

async function checkForSession(HWID) {
    return new Promise(async (Resolve) => {
        await ActiveSessions.forEach((Session) => {
            if (Session.Static_Identifier == HWID) {
                Resolve(Session);
            }
        })

        Resolve(null);
    })
}

async function blacklistInfo(info) {
    // var listCheck = await checkWhitelist(info.HWID);
    var disallowCheck = await getContents("dynamic_files/disallow.txt");
    if (disallowCheck.indexOf(info.IP) == -1) {
        fs.appendFile("dynamic_files/disallow.txt", "\n" + info.IP, function(e) {})
        fetch('YOURWEBHOOKURL', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: "Jump'd Whitelist Alerts",
                avatar_url: 'https://cdn.discordapp.com/avatars/411256446638882837/9a12fc7810795ded801fdb0401db0be6.png',
                content: '',
                allowed_mentions: {
                    parse: ['users', 'roles'],
                },
                embeds: [{
                    color: 11730954,
                    author: {
                        name: "Script Defender",
                    },
                    title: "Crack Attempt",
                    description: info.Reason,
                    "fields": [{
                            "name": "IP Address",
                            "value": info.IP,
                            "inline": true
                        },
                        {
                            "name": "||||",
                            "value": "||||",
                            "inline": true
                        },
                        {
                            "name": "User Identifier",
                            "inline": true,
                            "value": info.HWID
                        },
                    ]
                }, ],
            }),
        });
    }
}


app.use(express.json());
app.post('/', async (req, res) => {
    console.log(req.query);
    if (req.query["鹅"] == "белый список") {
        var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        IP = IP.replace("::ffff:", "");
        var DisallowFile = await getContents("dynamic_files/disallow.txt");
        var WhitelistCheck;
        if (CooldownIPs.indexOf(IP) !== -1) {
            res.send("Wait for the cooldown to end.");
            return;
        }
        if (!DisallowFile.includes(IP)) {
            if (req.header("Syn-User-Identifier")) {
                WhitelistCheck = await checkWhitelist(req.header("Syn-User-Identifier"));
                if (WhitelistCheck.Status) {
                    if (req.headers["cookie"] !== undefined || req.headers["cookie"] !== null) {
                        fetch("https://pnyx.dev/jumpd/data/http_check.php?ip=" + IP).then(Response => Response.text().then((Text) => {
                            if (Text == "Passed") {
                                if (req.get("User-Agent").indexOf("synx") !== -1) {
                                    var AuthKey = sha256(String(Math.random()))
                                    var SessionData = {
                                        "Static_Identifier": req.header("Syn-User-Identifier"),
                                        "Dynamic_UData": sha256(String(Number(req.body.Username.length + Math.random()) / 2.1)),
                                        "Dynamic_JobID": req.body.JobID,
                                        "Dynamic_ClientHash": req.body.Hash,
                                        "Dynamic_Authorization": AuthKey
                                    }
                                    ActiveSessions.push(SessionData);
                                    CooldownIPs.push(IP);
                                    setTimeout(() => {
                                        ActiveSessions.splice(ActiveSessions.indexOf(SessionData), 1)
                                        CooldownIPs.splice(CooldownIPs.indexOf(IP), 1)
                                    }, 10000)
                                    res.send(AuthKey)
                                } else {
                                    blacklistInfo({
                                        "HWID": req.header("Syn-User-Identifier"),
                                        "IP": IP,
                                        "Reason": "UserAgent check failed."
                                    })
                                    res.send("Unauthorized.");
                                }
                            } else {
                                blacklistInfo({
                                    "HWID": req.header("Syn-User-Identifier"),
                                    "IP": IP,
                                    "Reason": "HTTP(s) check failed."
                                })
                                res.send("Unauthorized.");
                            }
                        }))
                    } else {
                        blacklistInfo({
                            "HWID": req.header("Syn-User-Identifier"),
                            "IP": IP,
                            "Reason": "Cookie check failed."
                        })
                        res.send("Unauthorized.");
                    }
                } else {
                    blacklistInfo({
                        "HWID": req.header("Syn-User-Identifier"),
                        "IP": IP,
                        "Reason": "Not whitelisted."
                    })
                    res.send("Unauthorized.");
                }
            } else {
                blacklistInfo({
                    "HWID": "Was not sent.",
                    "IP": IP,
                    "Reason": "Header check failed."
                })
                res.send("Unauthorized.");
            }
        } else {
            res.send("Unauthorized");
            console.log("IP Address " + IP + " attempted to authenticate, but was on the disallow.");
        }
    } else if (req.query["饿"] == "разрешить") {
        var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        IP = IP.replace("::ffff:", "");
        var DisallowFile = await getContents("dynamic_files/disallow.txt");
        var WhitelistCheck;
        if (!DisallowFile.includes(IP)) {
            if (req.header("Syn-User-Identifier")) {
                WhitelistCheck = await checkWhitelist(req.header("Syn-User-Identifier"));
                if (WhitelistCheck.Status) {
                    if (req.headers["cookie"] !== undefined || req.headers["cookie"] !== null) {
                        var Session = await checkForSession(req.header("Syn-User-Identifier"))
                        if (req.headers.authorization !== null && req.headers.authorization !== undefined) {
                            if (Session !== null) {
                                if (req.headers.authorization == Session.Dynamic_Authorization) {
                                    console.log("Complete.");
                                    res.send(`syn["secure"] = tick()`)
                                } else {
                                    blacklistInfo({
                                        "HWID": req.header("Syn-User-Identifier"),
                                        "IP": IP,
                                        "Reason": "Authorization check failed."
                                    })
                                    res.send("while game do end");
                                }
                            } else {
                                blacklistInfo({
                                    "HWID": req.header("Syn-User-Identifier"),
                                    "IP": IP,
                                    "Reason": "Authorization check failed."
                                })
                                res.send("while game do end")
                            }
                        } else {
                            blacklistInfo({
                                "HWID": req.header("Syn-User-Identifier"),
                                "IP": IP,
                                "Reason": "Authorization check failed."
                            })
                            res.send("while game do end")
                        }
                    } else {
                        blacklistInfo({
                            "HWID": req.header("Syn-User-Identifier"),
                            "IP": IP,
                            "Reason": "Cookie check failed."
                        })
                        res.send("while game do end");
                    }
                } else {
                    blacklistInfo({
                        "HWID": req.header("Syn-User-Identifier"),
                        "IP": IP,
                        "Reason": "Not whitelisted."
                    })
                    res.send("while game do end");
                }
            } else {
                blacklistInfo({
                    "HWID": "Was not sent.",
                    "IP": IP,
                    "Reason": "Header check failed."
                })
                res.send("while game do end");
            }
        } else {
            res.send("while game do end");
            console.log("IP Address " + IP + " attempted to authenticate, but was on the disallow.")
        }
    }
})

app.listen(port, async () => {
    console.log("Listening...");
})
