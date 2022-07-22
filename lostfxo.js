const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

const config = require('./config.json');
const request = require('request');
const client = new Client(); 
let i = 0;
let proxyNum = 0;

client.on("ready", async () => {
	const guild = client.guilds.cache.get(config.sunucu)
    console.log(`${guild.name} sunucusu için "${config.url}" urlsi spamlanmaya başladı.`)
	let kanal = await guild.channels.cache.get(config.log);
	if(guild.vanityURLCode == config.url) {
		console.log(`HATA: Sunucunun URL'si zaten discord.gg/${guild.vanityURLCode}`)
		console.log(`Durum: Bottan Çıkış Yapıldı.`);
		return process.exit()
	};
	
	const token = config.token;
	const vanity = config.url;
	const guildId = guild.id;
	const owner = config.sahip;
	
	async function takeURL() {
		const spammer = {
			url: `https://discord.com/api/v9/guilds/${guildId}/vanity-url`,
			body: {
				code: `${vanity}`
			},
			json: true,
			method: 'PATCH',
			headers: {
				"Authorization": token
			}
		};
	
		request(spammer, async (e, res, body) => {
			if(e)
				return console.log(e);
				console.log(`${i}) İstek: URL'yi almak için istek gönderildi!`);
				switch(res.body.message){
					case 'You are being rate limited.':
						console.log(`API fazla istek gönderildiğinden dolayı IP'yi sınırlamış!`);
						return process.exit();
					case 'Invite code is either invalid or taken.':
						console.log(`${i}) Cevap: URL tekrar bir sunucuya bağlanmış!.`);
					break;
				};
				if(!res.body.message){
					await kanal.send(`Sunucunun URL'si artık discord.gg/${guild.vanityURLCode}`)
					await kanal.send(`<@${owner}>`)
					console.log(`${i}) Cevap: Sunucu URL'si ${guild.vanityURLCode} olarak başarıyla değiştirildi!`) 
					console.log(`Durum: Bottan Çıkış Yapıldı.`)
					return process.exit();
				};
				console.log(`${i}) Cevap: ${res.body.message}`)
				return URLChecker();
			});
	};

	async function URLChecker() {
		setTimeout(async () => {
			const proxyArray = fs.readFileSync('proxy.txt').toString().split("\n");
			if(proxyNum == proxyArray.length && proxyNum == 0){
				proxyNum = 0;
			} else {
				proxyNum = proxyNum + 1;
			};
			let checkURL = {
				headers: {
					'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36",
				},
				url: `https://discordapp.com/api/invites/${vanity}`,
				method: "GET",
				proxy: `http://${proxyArray[proxyNum]}`,
				json: true
			};
			request(checkURL, async (e, res, body) => {
				if(e){
					console.log(`${proxyNum}.Satırdaki proxy hatalı! Diğeri deneniyor...`);
					return URLChecker();
				};
				i = i + 1;
				console.log(`${i}) İstek: URL'yi denetlemek için istek gönderildi!`);
				if(res.body == 'error code: 1015'){
					console.log(`API fazla istek gönderildiğinden dolayı IP'yi sınırlamış!`);
					return URLChecker();
				};
				if(res.body.message == 'Unknown Invite'){
					console.log(`${i}) Cevap: URL boşta!`);
					return takeURL();
				};
				if(res.body.code == vanity) {
					console.log(`${i}) Cevap: URL hala bir sunucuya bağlı.`);
					return URLChecker();
				};
					
			});
		}, config.sure * 1000);
	};
	await URLChecker();
});

client.login(config.token).catch(e => { console.log(e)});