// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 1000,
    once: true,
    mirror: false,
    disable: 'mobile'
});

// Enhanced Three.js background animation with realistic galaxy
const initThreeJsBackground = () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('hero-canvas').appendChild(renderer.domElement);

    // Mouse interaction setup
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Track mouse movement
    const heroSection = document.querySelector('section:first-of-type');
    heroSection.addEventListener('mousemove', (event) => {
        const rect = heroSection.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    heroSection.addEventListener('mouseleave', () => {
        // Smooth reset when mouse leaves
        mouseX = 0;
        mouseY = 0;
    });

    // Create circular star texture
    const createStarTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Create circular gradient
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    };

    // Create star material with circular texture
    const starTexture = createStarTexture();

    // Create realistic star layer
    const createGalaxyLayer = (count, size, depth) => {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(count * 3);
        const velocities = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        const baseColors = new Float32Array(count * 3);

        // Realistic star colors based on stellar classification
        const starTypes = [
            { color: [1.0, 0.98, 0.98], probability: 0.30 },    // O/B - Blue/White (rare, bright)
            { color: [1.0, 1.0, 0.95], probability: 0.35 },     // A - White
            { color: [1.0, 1.0, 0.9], probability: 0.15 },      // F - Yellow-White
            { color: [1.0, 0.95, 0.8], probability: 0.10 },     // G - Yellow (Sun-like)
            { color: [1.0, 0.85, 0.6], probability: 0.05 },     // K - Orange
            { color: [1.0, 0.75, 0.6], probability: 0.05 }      // M - Red
        ];

        for (let i = 0; i < count * 3; i += 3) {
            // Create spiral arm distribution
            const arm = Math.floor(Math.random() * 4); // 4 spiral arms
            const angle = (arm * Math.PI / 2) + (Math.random() * Math.PI / 4);
            const distance = Math.random() * depth * 0.8;
            const spiralFactor = 0.3;
            
            const spiralAngle = angle + (distance * spiralFactor);
            vertices[i] = Math.cos(spiralAngle) * distance;
            vertices[i + 1] = (Math.random() - 0.5) * depth * 0.1; // Thin disk
            vertices[i + 2] = Math.sin(spiralAngle) * distance;

            // Random velocities for twinkling and movement
            velocities[i/3] = Math.random() * 0.2 + 0.1;

            // Select star type based on probability
            const rand = Math.random();
            let cumProb = 0;
            let selectedType = starTypes[0];
            
            for (const type of starTypes) {
                cumProb += type.probability;
                if (rand < cumProb) {
                    selectedType = type;
                    break;
                }
            }

            // Add slight color variation
            const variation = 0.05;
            baseColors[i] = selectedType.color[0] * (1 + (Math.random() - 0.5) * variation);
            baseColors[i + 1] = selectedType.color[1] * (1 + (Math.random() - 0.5) * variation);
            baseColors[i + 2] = selectedType.color[2] * (1 + (Math.random() - 0.5) * variation);

            // Set initial colors
            colors[i] = baseColors[i];
            colors[i + 1] = baseColors[i + 1];
            colors[i + 2] = baseColors[i + 2];
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.userData.baseColors = baseColors;

        const material = new THREE.PointsMaterial({
            size: size,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            map: starTexture,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        points.velocities = velocities;
        return points;
    };

    // Create multiple layers with different properties
    const galaxyLayers = [
        createGalaxyLayer(8000, 2.5, 1000),  // Core stars
        createGalaxyLayer(12000, 2, 1500),   // Mid-region stars
        createGalaxyLayer(15000, 1.5, 2000)  // Outer arm stars
    ];

    galaxyLayers.forEach(layer => scene.add(layer));
    camera.position.z = 1500;

    // Animation loop
    let lastTime = 0;
    const animate = (currentTime) => {
        requestAnimationFrame(animate);

        if (currentTime - lastTime >= 16) {
            // Smooth camera movement
            targetX += (mouseX - targetX) * 0.02;
            targetY += (mouseY - targetY) * 0.02;

            galaxyLayers.forEach((layer, index) => {
                const positions = layer.geometry.attributes.position.array;
                const colors = layer.geometry.attributes.color.array;
                const baseColors = layer.geometry.userData.baseColors;

                // Subtle layer tilt based on mouse position
                layer.rotation.x = targetY * 0.1;
                layer.rotation.y = targetX * 0.1;
                
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i];
                    const z = positions[i + 2];
                    const distance = Math.sqrt(x * x + z * z);
                    const rotationSpeed = 0.00005 * (1 - distance / 2000);
                    
                    const cos = Math.cos(rotationSpeed);
                    const sin = Math.sin(rotationSpeed);
                    positions[i] = x * cos - z * sin;
                    positions[i + 2] = z * cos + x * sin;

                    // Enhanced twinkling effect with mouse influence
                    const distanceToMouse = Math.sqrt(
                        Math.pow(x - targetX * 500, 2) + 
                        Math.pow(z - targetY * 500, 2)
                    );
                    const mouseInfluence = Math.max(0, 1 - distanceToMouse / 1000) * 0.2;
                    const brightness = 0.85 + 
                        Math.sin(currentTime * 0.001 * layer.velocities[i/3]) * 0.15 + 
                        mouseInfluence;

                    colors[i] = baseColors[i] * brightness;
                    colors[i + 1] = baseColors[i + 1] * brightness;
                    colors[i + 2] = baseColors[i + 2] * brightness;
                }

                layer.geometry.attributes.position.needsUpdate = true;
                layer.geometry.attributes.color.needsUpdate = true;
            });

            // Subtle camera movement
            camera.position.x += (targetX * 20 - camera.position.x) * 0.02;
            camera.position.y += (-targetY * 20 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
            lastTime = currentTime;
        }
    };

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    animate();
};

// Interactive card effects
const initCardEffects = () => {
    const cards = document.querySelectorAll('.work-card, .project-card, .contact-card');
    
    cards.forEach(card => {
        let rafId = null;
        
        card.addEventListener('mousemove', (e) => {
            if (rafId) cancelAnimationFrame(rafId);
            
            rafId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 30;
                const rotateY = (centerX - x) / 30;
                
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateZ(10px)
                `;
            });
        });

        card.addEventListener('mouseleave', () => {
            if (rafId) cancelAnimationFrame(rafId);
            
            rafId = requestAnimationFrame(() => {
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(0deg) 
                    rotateY(0deg) 
                    translateZ(0px)
                `;
            });
        });
    });
};

// Scroll performance optimization
const initScrollOptimization = () => {
    document.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
            // Add any scroll-based animations here
        });
    }, { passive: true });
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initThreeJsBackground();
    initCardEffects();
    initScrollOptimization();
});

// Add this to your existing script
document.querySelector('.golden-text').addEventListener('mousemove', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / e.target.clientWidth) * 100;
    const y = ((e.clientY - rect.top) / e.target.clientHeight) * 100;
    
    e.target.style.setProperty('--mouse-x', `${x}%`);
    e.target.style.setProperty('--mouse-y', `${y}%`);
}); 