import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En versiones recientes, esto puede ir fuera de experimental
  // o dentro, dependiendo estrictamente de la interfaz del tipo.
  // Si te sigue marcando error de tipo, usa la siguiente línea:
  allowedDevOrigins: ["192.168.1.136", "localhost:3000"],
};

export default nextConfig;