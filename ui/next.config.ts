import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	turbopack: {},
	distDir: ".next-dev",
	webpack: (config, { dev, isServer }) => {
		if (dev) {
			config.optimization.minimize = false;
			config.devtool = "eval-source-map";
		}
		return config;
	},
	productionBrowserSourceMaps: false,
};

export default nextConfig;
