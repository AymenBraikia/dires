"use client";
import { useEffect, useRef } from "react";
import draw from "./draw";
// import { wsConnection } from "../websocket/connection";
import keyboard from "../classes/keyboard";
// import { PacketID } from "../websocket/packets";
import mouse from "../classes/mouse";
import { user } from "../classes/user";
import { PacketID, socket_manager } from "@/lib/socket_manager";
import { UI } from "../classes/ui";

export default function Can() {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvas.current) return;
		UI.ctx = canvas.current.getContext("2d")!;

		canvas.current.width = innerWidth;
		canvas.current.height = innerHeight;

		user.screenH = innerHeight;
		user.screenW = innerWidth;

		draw(canvas.current);

		window.onresize = () => {
			if (!canvas.current) return;
			canvas.current.width = innerWidth;
			canvas.current.height = innerHeight;

			user.screenH = innerHeight;
			user.screenW = innerWidth;
			socket_manager.send([PacketID.screen, Math.ceil(user.screenW + 200), Math.ceil(user.screenH + 200)]);
			UI.changed = true;
		};
		if (!keyboard.is_set) {
			keyboard.init();
		}
		if (!mouse.is_set) mouse.init(canvas.current);
	}, []);

	return <canvas className="fixed left-0 top-0 -z-10" style={{ backgroundColor: "#0b442d" }} ref={canvas}></canvas>;
}
