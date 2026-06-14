"use client";
import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import logo from "../public/logo.png";

import Can from "./canvas/canvas";
import Glass from "./components/ui/glass_container";
import Input from "./components/ui/input";
import Button from "./components/ui/button";
import CBox from "./components/ui/cbox";
import OptionBtns from "./components/ui/optionBtns";
import RangeInp from "./components/ui/range";

import { socket_manager } from "@/lib/socket_manager";
import { user } from "./classes/user";
import { UI } from "./classes/ui";
import { set_settings, save_settings, settings_config } from "./ui_settings";

interface server {
	uri: string;
	name: string;
	location: string;
	players: number;
	ping: number;
	id: number;
}

let i = 0;
const servers = [
	{
		uri: "ws://localhost:8080/",
		name: "EU Central",
		location: "Frankfurt",
		players: 173,
		ping: 23,
		id: i++,
	},
	{
		uri: "ws://localhost:8080/",
		name: "US East",
		location: "Georgia",
		players: 104,
		ping: 97,
		id: i++,
	},
];

export default function Home() {
	const nickname_input = useRef<HTMLInputElement>(null);
	const playBtn = useRef<HTMLButtonElement>(null);

	const [nickname, set_nickname] = useState<string>((typeof window != "undefined" && localStorage.getItem("nickname")) || "");
	const [servers_list, set_servers] = useState<server[] | null>(servers);
	const [srv, set_srv] = useState<server>(servers_list![0] || servers[0]);
	const [, update_ui] = useState<number>(0);
	UI.update_ui = update_ui;
	// if (UI.refresh_ui) update_ui((e) => e + 1);

	useEffect(() => {
		set_settings();
	}, []);

	return (
		<>
			<Can />
			<Market />
			<Quest />
			<Recipe />
			<Settings />
			<Teams />

			{!user.alive && (
				<div className="w-dvw h-dvh flex justify-center items-center gap-12">
					<Glass classes="w-[20dvw] flex flex-col justify-center items-center gap-4 p-8">
						<div className="w-full flex justify-between items-center">
							<h3 className="font-bold text-3xl">Profile</h3>
							<Button content="Login" />
						</div>
						<div className="w-full flex justify-start items-center gap-4">
							<p className="w-16 aspect-square rounded-full bg-green-500 flex justify-center items-center font-bold text-3xl">G</p>
							<div className="flex justify-start items-center flex-col">
								<p className="w-full p-2">Guest</p>
								<p className="text-green-400 bg-green-400/20 p-2 rounded-full w-full">Level 3</p>
							</div>
						</div>
						<div className="flex flex-wrap justify-center items-center gap-4 w-full">
							<Glass classes="flex justify-center items-start flex-col w-5/12">
								<p className="text-blue-400 font-semibold flex justify-start items-center gap-2">
									<Target />
									Score
								</p>
								<p>1500</p>
							</Glass>
							<Glass classes="flex justify-center items-start flex-col w-5/12">
								<p className="text-yellow-400 font-semibold flex justify-start items-center gap-2">
									<Cup />
									Best
								</p>
								<p>1500</p>
							</Glass>
							<Glass classes="flex justify-center items-start flex-col w-5/12">
								<p className="text-green-400 font-semibold flex justify-start items-center gap-2">
									<Clock />
									Games
								</p>
								<p>1500</p>
							</Glass>
							<Glass classes="flex justify-center items-start flex-col w-5/12">
								<p className="text-purple-400 font-semibold flex justify-start items-center gap-2">
									<Person />
									Rank
								</p>
								<p>1500</p>
							</Glass>
						</div>
						<div className="flex justify-center items-center flex-col w-full">
							<div className="w-full flex justify-between items-center text-gray-400">
								<p>Level Progress</p>
								<p> 32%</p>
							</div>
							<div className="w-full h-[6px] bg-gray-700 rounded-full">
								<div className="w-[32%] h-full bg-green-400 rounded-full"></div>
							</div>
						</div>
					</Glass>

					<div className="w-fit-content min-w-[30dvw] h-dvh flex justify-center items-center flex-col gap-4">
						<Image alt="Logo" width={680} style={{ aspectRatio: "778/256" }} src={logo} />
						<Input
							ref={nickname_input}
							action={(e) => {
								user.name = e.currentTarget.value;
								localStorage.setItem("nickname", user.name);
								set_nickname(user.name || "");
							}}
							type="text"
							placeholder="Enter your Nickname"
							default_value={nickname}
							classes="text-center font-bold w-full text-xl"
						></Input>
						<div className="w-full flex justify-center items-center gap-4">
							{servers.map((s) => (
								<Glass onclick={() => set_srv(s)} key={s.id} classes={`w-1/2 flex justify-between items-center flex-wrap gap-y-4 cursor-pointer ${srv.id == s.id && "bg-green-500/10 border-green-500/40"}`}>
									<p className={`blink font-bold cursor-pointer ${srv.id == s.id && "text-green-500"}`}>{s.name}</p>
									<p className={`cursor-pointer ${srv.id == s.id && "text-green-500"}`}>{s.ping} ms</p>
									<div className={`w-full flex justify-between items-center gap-4 cursor-pointer ${srv.id == s.id ? "text-white" : "text-gray-500"}`}>
										<p className="cursor-pointer">Players: {s.players}</p>
										<p className="cursor-pointer">{s.location}</p>
									</div>
								</Glass>
							))}
						</div>
						<Button
							active={socket_manager.ws ? socket_manager.ws?.readyState == WebSocket.CLOSED : true}
							ref={playBtn}
							action={socket_manager.connect.bind(socket_manager, () => update_ui((e) => e + 1))}
							content={socket_manager.ws ? ([0, 2, 3].includes(socket_manager.ws.readyState) ? "Connecting..." : "Connected") : "Play Now"}
							classes="w-full font-bold text-2xl"
						/>
					</div>

					<div className="w-[20dvw] flex justify-between items-center flex-col gap-4 text-2xl">
						<div className="w-full flex justify-between items-center gap-4">
							<Glass classes="w-full flex justify-center items-center gap-4 py-6 cursor-pointer hover:text-green-400 hover:bg-green-400/5">
								<Cup s={32} /> Leaderboard
							</Glass>
							<Glass classes="w-full flex justify-center items-center gap-4 py-6 cursor-pointer hover:text-green-400 hover:bg-green-400/5">
								<Gear s={32} /> Settings
							</Glass>
						</div>
						<Glass classes="w-full flex justify-center items-center gap-4 py-6 cursor-pointer hover:text-green-400 hover:bg-green-400/5">
							<Cart s={32} /> Shop
						</Glass>
						<Glass classes="w-full flex justify-center items-center gap-4 py-6 cursor-pointer hover:text-green-400 hover:bg-green-400/5">
							<Accessory s={32} /> Skins
						</Glass>
						<Glass classes="w-full flex justify-center items-center gap-4 py-6 cursor-pointer hover:text-green-400 hover:bg-green-400/5">
							<Spin s={32} /> Wheel Spin
						</Glass>
					</div>
				</div>
			)}
		</>
	);
}

function Person({ s }: { s?: number }) {
	return (
		<svg fill="currentColor" width={s || "16"} height={s || "16"} viewBox="0 0 32 32">
			<path d="M16 15.503A5.041 5.041 0 1 0 16 5.42a5.041 5.041 0 0 0 0 10.083zm0 2.215c-6.703 0-11 3.699-11 5.5v3.363h22v-3.363c0-2.178-4.068-5.5-11-5.5z" />
		</svg>
	);
}
function Clock({ s }: { s?: number }) {
	return (
		<svg width={s || "16"} height={s || "16"} viewBox="0 0 24 24" fill="none">
			<path d="M12 7V12L14.5 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
function Cup({ s }: { s?: number }) {
	return (
		<svg width={s || "16"} height={s || "16"} viewBox="0 0 24 24" fill="none">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12.0002 1.25C10.1724 1.25 8.66129 1.41099 7.4984 1.60719L7.36355 1.62983C6.35333 1.79893 5.51366 1.93949 4.85712 2.74808C4.43608 3.26664 4.30023 3.82706 4.26891 4.4531L3.77686 4.61712C3.31373 4.77147 2.90781 4.90675 2.58577 5.05656C2.23762 5.21852 1.91857 5.42714 1.67466 5.76555C1.43076 6.10396 1.33375 6.47262 1.2902 6.85411C1.24992 7.20701 1.24996 7.63488 1.25 8.12304L1.25001 8.26827C1.25 8.67008 1.24999 9.02497 1.27965 9.32179C1.3118 9.64348 1.38299 9.95621 1.56083 10.2584C1.73867 10.5607 1.97748 10.7748 2.24307 10.9591C2.48813 11.1292 2.79836 11.3015 3.14962 11.4966L5.79078 12.964C6.33018 14.0252 7.07115 14.9713 8.09017 15.6548C8.97721 16.2497 10.0418 16.6232 11.3028 16.723C11.2687 16.8087 11.25 16.9022 11.25 17V18.75H9.81981C8.98562 18.75 8.26739 19.3388 8.10379 20.1568L7.88515 21.25H6C5.58579 21.25 5.25 21.5858 5.25 22C5.25 22.4142 5.58579 22.75 6 22.75H18C18.4142 22.75 18.75 22.4142 18.75 22C18.75 21.5858 18.4142 21.25 18 21.25H16.1149L15.8962 20.1568C15.7326 19.3388 15.0144 18.75 14.1802 18.75H12.75V17C12.75 16.9022 12.7313 16.8087 12.6972 16.723C13.9583 16.6233 15.023 16.2498 15.9101 15.6548C16.9292 14.9713 17.6703 14.025 18.2097 12.9637L20.8503 11.4966C21.2016 11.3015 21.5118 11.1292 21.7569 10.9591C22.0225 10.7748 22.2613 10.5607 22.4391 10.2584C22.617 9.95621 22.6882 9.64348 22.7203 9.32179C22.75 9.02499 22.75 8.67012 22.75 8.26834L22.75 8.12306C22.75 7.63488 22.75 7.20701 22.7098 6.85411C22.6662 6.47262 22.5692 6.10396 22.3253 5.76555C22.0814 5.42714 21.7623 5.21852 21.4142 5.05656C21.0921 4.90675 20.6862 4.77147 20.2231 4.61712L19.7314 4.45322C19.7001 3.82713 19.5643 3.26668 19.1432 2.74808C18.4866 1.93949 17.647 1.79893 16.6368 1.62983L16.5019 1.60719C15.339 1.41099 13.8279 1.25 12.0002 1.25ZM14.5852 21.25L14.4253 20.451C14.402 20.3341 14.2994 20.25 14.1802 20.25H9.81981C9.70064 20.25 9.59804 20.3341 9.57467 20.451L9.41486 21.25H14.5852ZM4.28849 6.02772L4.3021 6.02318C4.37367 7.54348 4.5454 9.22376 4.97298 10.7937L3.90729 10.2016C3.51814 9.98542 3.27447 9.84906 3.09829 9.72679C2.93588 9.61407 2.88298 9.54762 2.85363 9.49774C2.82428 9.44786 2.79187 9.36934 2.77221 9.17263C2.75089 8.95925 2.75002 8.68002 2.75001 8.23484L2.75001 8.16231C2.74999 7.62323 2.75111 7.28191 2.78053 7.02422C2.80775 6.7857 2.85231 6.69703 2.89154 6.6426C2.93077 6.58817 3.0008 6.51786 3.21847 6.4166C3.45362 6.3072 3.77708 6.19819 4.28849 6.02772ZM19.6982 6.0233C19.6266 7.54349 19.4549 9.22364 19.0274 10.7935L20.0927 10.2016C20.4818 9.98542 20.7255 9.84906 20.9017 9.72679C21.0641 9.61407 21.117 9.54762 21.1463 9.49774C21.1757 9.44786 21.2081 9.36934 21.2277 9.17263C21.2491 8.95925 21.2499 8.68002 21.25 8.23484L21.25 8.16231C21.25 7.62323 21.2488 7.28191 21.2194 7.02422C21.1922 6.7857 21.1477 6.69703 21.1084 6.6426C21.0692 6.58817 20.9992 6.51786 20.7815 6.4166C20.5463 6.3072 20.2229 6.19819 19.7115 6.02772L19.6982 6.0233ZM7.74796 3.08629C8.83319 2.90319 10.2608 2.75 12.0002 2.75C13.7395 2.75 15.1671 2.90319 16.2524 3.08629C17.4593 3.28992 17.7128 3.3661 17.9787 3.69358C18.2407 4.01632 18.2656 4.32156 18.2118 5.67672C18.1222 7.93537 17.8242 10.3727 16.9015 12.2264C16.446 13.1414 15.8505 13.8887 15.0746 14.409C14.3037 14.9261 13.3092 15.25 12.0002 15.25C10.6911 15.25 9.69656 14.9261 8.92569 14.409C8.14983 13.8887 7.55432 13.1414 7.09884 12.2264C6.1761 10.3727 5.87815 7.93537 5.78848 5.67672C5.73468 4.32156 5.75956 4.01632 6.02161 3.69358C6.28751 3.3661 6.54104 3.28992 7.74796 3.08629Z"
				fill="currentColor"
			/>
		</svg>
	);
}
function Target({ s }: { s?: number }) {
	return (
		<svg fill="currentColor" width={s || "16"} height={s || "16"} viewBox="0 0 24 24">
			<path d="M12,1A11,11,0,1,0,23,12,11.013,11.013,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9.011,9.011,0,0,1,12,21ZM12,4.5A7.5,7.5,0,1,0,19.5,12,7.508,7.508,0,0,0,12,4.5Zm0,13A5.5,5.5,0,1,1,17.5,12,5.506,5.506,0,0,1,12,17.5ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z" />
		</svg>
	);
}

function Gear({ s }: { s?: number }) {
	return (
		<svg width={s || "32"} height={s || "32"} viewBox="0 0 24 24" fill="none">
			<path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path
				d="M12.9046 3.06005C12.6988 3 12.4659 3 12 3C11.5341 3 11.3012 3 11.0954 3.06005C10.7942 3.14794 10.5281 3.32808 10.3346 3.57511C10.2024 3.74388 10.1159 3.96016 9.94291 4.39272C9.69419 5.01452 9.00393 5.33471 8.36857 5.123L7.79779 4.93281C7.3929 4.79785 7.19045 4.73036 6.99196 4.7188C6.70039 4.70181 6.4102 4.77032 6.15701 4.9159C5.98465 5.01501 5.83376 5.16591 5.53197 5.4677C5.21122 5.78845 5.05084 5.94882 4.94896 6.13189C4.79927 6.40084 4.73595 6.70934 4.76759 7.01551C4.78912 7.2239 4.87335 7.43449 5.04182 7.85566C5.30565 8.51523 5.05184 9.26878 4.44272 9.63433L4.16521 9.80087C3.74031 10.0558 3.52786 10.1833 3.37354 10.3588C3.23698 10.5141 3.13401 10.696 3.07109 10.893C3 11.1156 3 11.3658 3 11.8663C3 12.4589 3 12.7551 3.09462 13.0088C3.17823 13.2329 3.31422 13.4337 3.49124 13.5946C3.69158 13.7766 3.96395 13.8856 4.50866 14.1035C5.06534 14.3261 5.35196 14.9441 5.16236 15.5129L4.94721 16.1584C4.79819 16.6054 4.72367 16.829 4.7169 17.0486C4.70875 17.3127 4.77049 17.5742 4.89587 17.8067C5.00015 18.0002 5.16678 18.1668 5.5 18.5C5.83323 18.8332 5.99985 18.9998 6.19325 19.1041C6.4258 19.2295 6.68733 19.2913 6.9514 19.2831C7.17102 19.2763 7.39456 19.2018 7.84164 19.0528L8.36862 18.8771C9.00393 18.6654 9.6942 18.9855 9.94291 19.6073C10.1159 20.0398 10.2024 20.2561 10.3346 20.4249C10.5281 20.6719 10.7942 20.8521 11.0954 20.94C11.3012 21 11.5341 21 12 21C12.4659 21 12.6988 21 12.9046 20.94C13.2058 20.8521 13.4719 20.6719 13.6654 20.4249C13.7976 20.2561 13.8841 20.0398 14.0571 19.6073C14.3058 18.9855 14.9961 18.6654 15.6313 18.8773L16.1579 19.0529C16.605 19.2019 16.8286 19.2764 17.0482 19.2832C17.3123 19.2913 17.5738 19.2296 17.8063 19.1042C17.9997 18.9999 18.1664 18.8333 18.4996 18.5001C18.8328 18.1669 18.9994 18.0002 19.1037 17.8068C19.2291 17.5743 19.2908 17.3127 19.2827 17.0487C19.2759 16.8291 19.2014 16.6055 19.0524 16.1584L18.8374 15.5134C18.6477 14.9444 18.9344 14.3262 19.4913 14.1035C20.036 13.8856 20.3084 13.7766 20.5088 13.5946C20.6858 13.4337 20.8218 13.2329 20.9054 13.0088C21 12.7551 21 12.4589 21 11.8663C21 11.3658 21 11.1156 20.9289 10.893C20.866 10.696 20.763 10.5141 20.6265 10.3588C20.4721 10.1833 20.2597 10.0558 19.8348 9.80087L19.5569 9.63416C18.9478 9.26867 18.6939 8.51514 18.9578 7.85558C19.1262 7.43443 19.2105 7.22383 19.232 7.01543C19.2636 6.70926 19.2003 6.40077 19.0506 6.13181C18.9487 5.94875 18.7884 5.78837 18.4676 5.46762C18.1658 5.16584 18.0149 5.01494 17.8426 4.91583C17.5894 4.77024 17.2992 4.70174 17.0076 4.71872C16.8091 4.73029 16.6067 4.79777 16.2018 4.93273L15.6314 5.12287C14.9961 5.33464 14.3058 5.0145 14.0571 4.39272C13.8841 3.96016 13.7976 3.74388 13.6654 3.57511C13.4719 3.32808 13.2058 3.14794 12.9046 3.06005Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
function Cart({ s }: { s?: number }) {
	return (
		<svg width={s || "32"} height={s || "32"} viewBox="0 0 24 24" fill="none">
			<path
				d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
function Accessory({ s }: { s?: number }) {
	return (
		<svg style={{ fill: "currentcolor" }} width={s || "32"} height={s || "32"} viewBox="0 0 96 96" version="1.1">
			<g id="banana" />

			<g id="Layer_12" />

			<g id="grape" />

			<g id="assasin" />

			<g id="gold" />

			<g id="mage_ass" />

			<g id="fighter" />

			<g id="SUPPORT" />

			<g id="marksman" />

			<g id="JUNGLE" />

			<g id="TANK" />

			<g className="st0" id="creditcard" />

			<g className="st0" id="CAKE" />

			<g className="st0" id="TOPI" />

			<g className="st0" id="SPATU" />

			<g className="st0" id="SETTING" />

			<g className="st0" id="CART" />

			<g className="st0" id="k3" />

			<g className="st0" id="computer" />

			<g className="st0" id="phone" />

			<g className="st0" id="location" />

			<g id="koper">
				<g id="Layer_29" />

				<path d="M60.1,65l-4.6,1c-4.9,1.1-10.1,1.1-15,0l-4.6-1c-2.3-0.6-3.9-1.7-4.9-3.2C34.2,63,40.5,65,48.3,65c5,0,10.6-0.8,16.5-3.2   C63.7,63.3,62.1,64.2,60.1,65z M66,59.1c-17.5,8.1-33.5,1.2-36,0c-0.1-0.5-0.2-1-0.2-1.5c3,1.2,10,3.6,18.8,3.6   c5.4,0,11.5-0.9,17.7-3.6C66.2,58.2,66.1,58.7,66,59.1z M38.8,32.9l0.5,0.4c4.9,4.7,12.6,4.7,17.5,0l0.5-0.4   c3.4,0.1,5.9,1.6,7.4,4.3c-0.2,0-0.3,0.1-0.5,0.2c-1,0.7-1.8,1.3-2.6,1.8c-3.9,2.8-5.8,4.2-13.5,4.2c0,0,0,0,0,0   c-9.8,0-15.9-6.2-16-6.3c-0.1-0.1-0.3-0.2-0.4-0.2C33.1,34.3,35.6,33,38.8,32.9z M30.7,38.5c1,1,7.3,6.7,17.3,6.7c0,0,0,0,0,0   c8.4,0,10.7-1.7,14.7-4.5c0.8-0.5,1.6-1.1,2.5-1.8c0.1,0,0.1-0.1,0.1-0.1c0.6,1.7,0.9,3.8,0.9,6.1v10.5c-17.2,7.9-33.5,1.4-36.6,0   V45C29.7,42.4,30,40.3,30.7,38.5z M83.7,57.7c-0.9,5.4-7.8,13.2-19.3,17.4c-5.1,1.8-10.7,2.8-16.4,2.8c-0.1,0-0.1,0-0.2,0   c-8.7,0-17.6-2.4-24.4-6.7c0,0-0.1-0.1-0.1-0.1l0,0c-7.9-5-10.9-10.7-11.2-14c-0.1-1,0.1-2.5,1.3-3.5c1.3-1.2,3.4-0.6,6.8,0.5   c2.2,0.7,4.7,1.5,7.4,1.8v0.2c0,5.9,2.4,9.4,7.7,10.8l4.7,1.1c2.6,0.6,5.3,0.9,7.9,0.9c2.7,0,5.3-0.3,7.9-0.9l4.7-1.1   c0,0,0.1,0,0.1,0c3.4-1.3,6-3.1,7.1-6.7c0,0,0-0.1,0-0.1c0.3-1.1,0.5-2.5,0.5-4v-1.2c2.4-0.4,4.4-1,6.2-1.5c4.2-1.2,6.1-1.7,8,0.2   c0,0,0,0,0.1,0.1C83.9,54.7,83.9,56.4,83.7,57.7z" />
			</g>

			<g className="st0" id="guide" />

			<g id="MAGICAL" />

			<g id="phisical" />

			<g id="mango" />

			<g id="orange" />
		</svg>
	);
}
function Spin({ s }: { s?: number }) {
	return (
		<svg style={{ fill: "currentcolor" }} version="1.1" id="Uploaded to svgrepo.com" width={s || "32"} height={s || "32"} viewBox="0 0 32 32">
			<path
				className="linesandangles_een"
				d="M16,4C9.373,4,4,9.373,4,16c0,6.627,5.373,12,12,12s12-5.373,12-12C28,9.373,22.627,4,16,4z
	 M16.707,16.707C16.452,16.962,16.155,17,16,17c-0.155,0-0.452-0.038-0.707-0.293C15.038,16.452,15,16.155,15,16
	c0-0.155,0.038-0.452,0.293-0.707c0.506-0.506,3.261-2.574,5.983-4.568C19.284,13.444,17.217,16.197,16.707,16.707z M24.118,10.219
	c0.987,1.38,1.654,3.004,1.831,4.781h-5.352C21.844,13.342,23.238,11.433,24.118,10.219z M21.781,7.882
	c-1.213,0.881-3.123,2.275-4.781,3.521V6.051C18.777,6.228,20.401,6.895,21.781,7.882z M15,6.051v6.886
	c-0.523,0.414-0.929,0.75-1.121,0.942c-0.327,0.327-0.553,0.713-0.697,1.121H6.051C6.521,10.283,10.283,6.521,15,6.051z M6.051,17
	h7.131c0.144,0.409,0.37,0.794,0.697,1.121s0.713,0.553,1.121,0.697v7.131C10.283,25.479,6.521,21.717,6.051,17z M17,25.949v-7.131
	c0.409-0.144,0.794-0.37,1.121-0.697c0.194-0.194,0.53-0.599,0.943-1.121h6.885C25.479,21.717,21.717,25.479,17,25.949z"
			/>
		</svg>
	);
}

function Market() {
	return (
		<div className={`market hidden absolute left-1/2 top-1/2 -translate-1/2 flex-col justify-center items-center gap-4 border-[3px] border-solid p-8`} style={{ borderColor: UI.clrs.secondary, backgroundColor: UI.clrs.primary }}>
			test
		</div>
	);
}

function Quest() {
	return (
		<div
			className={`quest hidden text-2xl text-center absolute left-1/2 top-1/2 -translate-1/2 flex-col justify-start items-center border-[3px] border-solid rounded-2xl p-8 w-3/4 max-w-[2000px] h-3/4 max-h-[900px] overflow-y-auto overflow-x-hidden`}
			style={{ borderColor: UI.clrs.secondary, backgroundColor: UI.clrs.primary, opacity: settings_config.panel_opacity }}
		>
			<div className="w-full p-4 flex justify-center items-center gap-8 font-bold">
				<p className="w-10">reward</p>
				<p className="w-1/2">goal</p>
				<p className="w-2/5">rules</p>
				<p className="w-60">time left</p>
				<p className="w-60">claim</p>
			</div>
			{user.quests_list.map((q) => (
				<div key={q.id} className="w-full p-4 flex justify-center items-center gap-8 relative">
					<div className="relative max-w-25 min-w-20 aspect-square">
						<Image src={q.i} alt={q.i} fill />
					</div>
					<p className="w-1/2">{q.details}</p>
					<p className="w-2/5">{q.requirements}</p>
					<p className="w-60">{format_time(q.time_left)}</p>
					{q.can_claim ? (
						q.claimed ? (
							<p className="w-60">claimed</p>
						) : (
							<p style={{ background: UI.clrs.secondary }} className={`w-60 cursor-pointer rounded-2xl p-2.5`}>
								claim
							</p>
						)
					) : (
						<p className="w-60">not completed</p>
					)}
				</div>
			))}
		</div>
	);
}
function Recipe() {
	return (
		<div
			className={`recipe hidden absolute left-1/2 top-1/2 -translate-1/2 flex-col justify-center items-center gap-4 border-[3px] border-solid p-8`}
			style={{ borderColor: UI.clrs.secondary, backgroundColor: UI.clrs.primary, opacity: settings_config.panel_opacity }}
		>
			test
		</div>
	);
}
function Settings() {
	const [, refresh_ui] = useState<number>(-1);
	const [, setOpacity] = useState<number>(settings_config.panel_opacity);
	return (
		<div
			className={`settings hidden text-2xl text-center absolute left-1/2 top-1/2 -translate-1/2 flex-col justify-start items-center border-[3px] border-solid rounded-2xl p-8 w-1/4 max-w-[800px] min-w-[600px] h-3/4 max-h-[800px] overflow-y-auto overflow-x-hidden`}
			style={{ borderColor: UI.clrs.secondary, backgroundColor: UI.clrs.primary, opacity: settings_config.panel_opacity }}
		>
			<h1 className="font-bold text-5xl" style={{ color: UI.clrs.tertiary }}>
				Settings
			</h1>
			<div className="w-full p-4 flex justify-center items-center gap-8 flex-col">
				<div className="w-full flex justify-center items-center relative">
					<div className="absolute left-1/2 top-1/2 -translate-1/2 w-full h-[3px] -z-10" style={{ backgroundColor: UI.clrs.tertiary }}></div>
					<h1 className="font-bold text-2xl border-3 rounded-2xl p-4" style={{ backgroundColor: UI.clrs.primary, borderColor: UI.clrs.tertiary, color: UI.clrs.tertiary }}>
						Visuals
					</h1>
				</div>
				<CBox checked={settings_config.safe_cancel} parent_classes="justify-between w-full" label="Safe cancel" />
				<CBox checked={settings_config.safe_drop} parent_classes="justify-between w-full" label="Safe drop" />
				<CBox checked={settings_config.colored_inv} parent_classes="justify-between w-full" label="Colored inventory" />
				<RangeInp
					min={0.3}
					max={1}
					defaultVal={settings_config.panel_opacity}
					action={(v) => {
						settings_config.panel_opacity = v;
						save_settings();
						setOpacity(v);
					}}
					label="panels opacity"
				/>
				<OptionBtns active={settings_config.quality == "high" ? 0 : 1} label="Quality" opts={["High", "Low"]} classes="w-full" />
				<div className="w-full flex justify-center items-center relative">
					<div className="absolute left-1/2 top-1/2 -translate-1/2 w-full h-[3px] -z-10" style={{ backgroundColor: UI.clrs.tertiary }}></div>
					<h1 className="font-bold text-2xl border-3 rounded-2xl p-4" style={{ backgroundColor: UI.clrs.primary, borderColor: UI.clrs.tertiary, color: UI.clrs.tertiary }}>
						Misc
					</h1>
				</div>
				<CBox checked={settings_config.auto_ice} parent_classes="justify-between w-full" label="Auto ice" />
				<CBox checked={settings_config.auto_craft} parent_classes="justify-between w-full" label="Auto craft" />
				<CBox checked={settings_config.auto_put} parent_classes="justify-between w-full" label="Auto put" />
				<CBox checked={settings_config.auto_take} parent_classes="justify-between w-full" label="Auto take" />
				<CBox checked={settings_config.auto_book} parent_classes="justify-between w-full" label="Auto book" />
				<CBox checked={settings_config.auto_eat} parent_classes="justify-between w-full" label="Auto eat" />
				<OptionBtns active={settings_config.keyboard == "qwerty" ? 0 : 1} label="Keyboard" opts={["QWERTY", "AZERTY"]} classes="w-full" />
				<RangeInp
					min={10}
					max={1e3}
					defaultVal={settings_config.put_amount}
					label="put amount"
					action={(v) => {
						settings_config.put_amount = v;
						save_settings();
						user.put_amount = v;
						refresh_ui(v);
					}}
				/>
			</div>
		</div>
	);
}
function Teams() {
	return (
		<div
			className={`teams hidden absolute left-1/2 top-1/2 -translate-1/2 flex-col justify-center items-center gap-4 border-[3px] border-solid p-8`}
			style={{ borderColor: UI.clrs.secondary, backgroundColor: UI.clrs.primary, opacity: settings_config.panel_opacity }}
		>
			test
		</div>
	);
}

function format_time(t: number): string {
	let format = "";
	if (!socket_manager.current_socket?.open) return "";

	if (t >= 3_600_000) {
		let h = Math.floor(t / 3_600_000);
		format += h + "h ";
		t -= h * 3_600_000;
	}
	if (t >= 60_000) {
		let m = Math.floor(t / 60_000);
		format += m + "min ";
		t -= m * 60_000;
	}
	if (t >= 1_000) {
		let s = Math.floor(t / 1_000);
		format += s + "s";
		t -= s * 1_000;
	}

	// 75 seconds
	return format.trim() || "0s";
}
