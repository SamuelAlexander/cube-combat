import { GameConfig } from '../config/gameConfig.js';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { BulletManager } from '../entities/BulletManager.js';
import { UIManager } from '../ui/UIManager.js';
import { MapManager } from '../entities/MapManager.js';
import { WeaponManager } from '../entities/WeaponManager.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        
        this.isGameActive = false;
        this.isPlayerDead = false;
        this.currentWave = 0;
        this.killCount = 0;
        this.deathCount = 0;
        
        this.initialize();
    }
    
    initialize() {
        // Setup scene
        this.scene.background = new THREE.Color(GameConfig.MAP.SKY_COLOR);
        this.scene.fog = new THREE.Fog(GameConfig.MAP.SKY_COLOR, 0, GameConfig.MAP.FOG_DENSITY);
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Setup camera
        this.camera.position.y = 2;
        const cameraContainer = new THREE.Object3D();
        cameraContainer.add(this.camera);
        this.scene.add(cameraContainer);
        
        // Setup physics world
        this.world.gravity.set(0, GameConfig.PHYSICS.GRAVITY, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = GameConfig.PHYSICS.SOLVER_ITERATIONS;
        
        // Initialize managers
        this.mapManager = new MapManager(this.scene, this.world);
        this.player = new Player(this.scene, this.world, this.camera);
        this.enemyManager = new EnemyManager(this.scene, this.world, this.player);
        this.bulletManager = new BulletManager(this.scene, this.player, this.enemyManager);
        this.weaponManager = new WeaponManager(this.scene, this.player, this.bulletManager);
        this.uiManager = new UIManager(this.player, this.weaponManager);
        
        // Add event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
    }
    
    startGame() {
        this.isGameActive = true;
        this.resetGame();
        this.renderer.domElement.requestPointerLock();
    }
    
    resetGame() {
        this.player.reset();
        this.enemyManager.reset();
        this.bulletManager.reset();
        this.weaponManager.reset();
        this.currentWave = 0;
        this.killCount = 0;
        this.deathCount = 0;
        this.isPlayerDead = false;
        this.uiManager.reset();
        this.startNextWave();
    }
    
    startNextWave() {
        this.currentWave++;
        const waveConfig = this.calculateWaveConfig();
        this.enemyManager.startWave(waveConfig);
        this.uiManager.updateWaveInfo(this.currentWave);
    }
    
    calculateWaveConfig() {
        return {
            enemyCount: GameConfig.WAVE.BASE_ENEMY_COUNT + Math.floor(this.currentWave / 2),
            health: GameConfig.ENEMY.BASE_HEALTH + (this.currentWave - 1) * GameConfig.WAVE.ENEMY_HEALTH_INCREASE,
            damage: GameConfig.ENEMY.BASE_DAMAGE + (this.currentWave - 1) * GameConfig.WAVE.ENEMY_DAMAGE_INCREASE,
            speed: GameConfig.ENEMY.BASE_SPEED + (this.currentWave - 1) * GameConfig.WAVE.ENEMY_SPEED_INCREASE,
            fireRate: Math.max(800, GameConfig.ENEMY.BASE_FIRE_RATE - (this.currentWave - 1) * GameConfig.WAVE.ENEMY_FIRE_RATE_DECREASE)
        };
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onKeyDown(event) {
        if (!this.isGameActive) return;
        this.player.handleKeyDown(event);
    }
    
    onKeyUp(event) {
        if (!this.isGameActive) return;
        this.player.handleKeyUp(event);
    }
    
    onMouseDown(event) {
        if (!this.isGameActive || this.isPlayerDead) return;
        this.player.handleMouseDown(event);
    }
    
    onMouseUp(event) {
        if (!this.isGameActive) return;
        this.player.handleMouseUp(event);
    }
    
    onMouseMove(event) {
        if (!this.isGameActive || document.pointerLockElement !== this.renderer.domElement) return;
        this.player.handleMouseMove(event);
    }
    
    update() {
        if (!this.isGameActive) return;
        
        // Update physics world
        this.world.step(this.deltaTime);
        
        // Update game entities
        this.player.update(this.deltaTime);
        this.enemyManager.update(this.deltaTime);
        this.bulletManager.update(this.deltaTime);
        this.weaponManager.update(this.deltaTime);
        
        // Check wave completion
        if (this.enemyManager.isWaveComplete()) {
            this.startNextWave();
        }
        
        // Check game over
        if (this.killCount >= GameConfig.WIN_CONDITION.KILLS_REQUIRED) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.isGameActive = false;
        this.uiManager.showGameOver(this.killCount, this.deathCount, this.currentWave);
        document.exitPointerLock();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Get delta time
        this.deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        // Update game state
        this.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
} 