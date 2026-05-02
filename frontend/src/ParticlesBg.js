import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

function ParticlesBg() {
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        background: { color: "transparent" },
        particles: {
          number: { value: 40 },
          size: { value: 2 },
          move: { enable: true, speed: 1 },
          opacity: { value: 0.5 },
          links: {
            enable: true,
            distance: 120,
            color: "#6366f1",
            opacity: 0.2,
          },
        },
      }}
      style={{
        position: "fixed",
        zIndex: -1,
      }}
    />
  );
}

export default ParticlesBg;