import { GameConfig } from '../config/gameConfig.js';

export class EnemyManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        
        this.enemies = [];
        this.enemiesRemaining = 0;
        this.isWaveComplete = false;
        this.waveStartTime = 0;
        
        this.aiTargets = [
            new THREE.Vector3(30, 2, 30),
            new THREE.Vector3(-30, 2, -30),
            new THREE.Vector3(30, 2, -30),
            new THREE.Vector3(-30, 2, 30),
            new THREE.Vector3(0, 8, 0),
            new THREE.Vector3(15, 6, -15),
            new THREE.Vector3(-15, 6, 15),
            new THREE.Vector3(20, 5, 20),
            new THREE.Vector3(-20, 5, -20)
        ];
        
        this.initialize();
    }
    
    initialize() {
        // Create enemy mesh template
        this.enemyMeshTemplate = this.createEnemyMesh();
        this.enemyPhysicsBodyTemplate = this.createEnemyPhysicsBody();
    }
    
    createEnemyMesh() {
        const enemyGroup = new THREE.Group();
        
        // Create main body
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0xff0000,
            emissiveIntensity: 0.2
        });
        const enemyBodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        enemyBodyMesh.castShadow = true;
        enemyBodyMesh.receiveShadow = true;
        enemyGroup.add(enemyBodyMesh);
        
        // Add head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        const enemyHead = new THREE.Mesh(headGeometry, headMaterial);
        enemyHead.position.y = 1.1;
        enemyHead.castShadow = true;
        enemyHead.receiveShadow = true;
        enemyGroup.add(enemyHead);
        
        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.3, 0.3);
        enemyGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.3, 0.3);
        enemyGroup.add(rightEye);
        
        // Add weapon
        const weaponGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const weaponMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.1
        });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.6, 0.8, 0);
        weapon.rotation.z = -Math.PI / 4;
        weapon.castShadow = true;
        weapon.receiveShadow = true;
        enemyGroup.add(weapon);
        
        // Add weapon glow
        const weaponGlowGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const weaponGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        const weaponGlow = new THREE.Mesh(weaponGlowGeometry, weaponGlowMaterial);
        weaponGlow.position.set(0.8, 0.8, 0);
        weaponGlow.rotation.z = -Math.PI / 4;
        enemyGroup.add(weaponGlow);
        
        return enemyGroup;
    }
    
    createEnemyPhysicsBody() {
        const enemyShape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
        const enemyPhysicsBody = new CANNON.Body({ mass: 5 });
        enemyPhysicsBody.addShape(enemyShape);
        enemyPhysicsBody.linearDamping = 0.9;
        
        return enemyPhysicsBody;
    }
    
    createEnemyHealthBar() {
        const healthBarContainer = document.createElement('div');
        healthBarContainer.className = 'enemyHealthBar';
        healthBarContainer.style.position = 'absolute';
        healthBarContainer.style.width = '100px';
        healthBarContainer.style.height = '10px';
        healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        healthBarContainer.style.borderRadius = '2px';
        healthBarContainer.style.overflow = 'hidden';
        healthBarContainer.style.display = 'none';
        
        const healthBarFill = document.createElement('div');
        healthBarFill.className = 'enemyHealthBarFill';
        healthBarFill.style.width = '100%';
        healthBarFill.style.height = '100%';
        healthBarFill.style.backgroundColor = '#f44';
        healthBarFill.style.transition = 'width 0.3s';
        healthBarContainer.appendChild(healthBarFill);
        
        return healthBarContainer;
    }
    
    reset() {
        // Remove all enemies
        this.enemies.forEach(enemy => {
            if (enemy.healthBar && enemy.healthBar.parentNode) {
                enemy.healthBar.parentNode.removeChild(enemy.healthBar);
            }
            this.scene.remove(enemy.mesh);
            this.world.remove(enemy.body);
        });
        
        this.enemies = [];
        this.enemiesRemaining = 0;
        this.isWaveComplete = false;
        this.waveStartTime = 0;
    }
    
    startWave(waveConfig) {
        this.isWaveComplete = false;
        this.enemiesRemaining = 0;
        
        // Create enemies for this wave
        for (let i = 0; i < waveConfig.enemyCount; i++) {
            this.createEnemy(waveConfig);
        }
    }
    
    createEnemy(waveConfig) {
        // Clone the mesh template
        const enemyMesh = this.enemyMeshTemplate.clone();
        this.scene.add(enemyMesh);
        
        // Clone the physics body template
        const enemyBody = this.enemyPhysicsBodyTemplate.clone();
        
        // Position randomly
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        enemyBody.position.set(x, 5, z);
        
        // Create health bar
        const healthBar = this.createEnemyHealthBar();
        document.getElementById('ui').appendChild(healthBar);
        
        // Create enemy object
        const enemy = {
            mesh: enemyMesh,
            body: enemyBody,
            healthBar: healthBar,
            healthBarFill: healthBar.querySelector('.enemyHealthBarFill'),
            weapon: enemyMesh.children[3],
            weaponGlow: enemyMesh.children[4],
            health: waveConfig.health,
            maxHealth: waveConfig.health,
            damage: waveConfig.damage,
            speed: waveConfig.speed,
            fireRate: waveConfig.fireRate,
            state: 'patrol',
            lastShot: 0,
            currentTarget: Math.floor(Math.random() * this.aiTargets.length),
            respawnTime: 0,
            isDead: false
        };
        
        this.world.addBody(enemyBody);
        this.enemies.push(enemy);
        this.enemiesRemaining++;
    }
    
    update(deltaTime) {
        this.enemies.forEach((enemy, index) => {
            if (enemy.isDead) {
                // Handle respawn
                enemy.respawnTime -= deltaTime;
                if (enemy.respawnTime <= 0) {
                    this.respawnEnemy(enemy);
                }
                return;
            }
            
            // Update enemy mesh position and rotation based on physics body
            enemy.mesh.position.copy(enemy.body.position);
            enemy.mesh.quaternion.copy(enemy.body.quaternion);
            
            // Update health bar position
            this.updateEnemyHealthBar(enemy);
            
            // Update AI behavior
            this.updateEnemyAI(enemy);
        });
    }
    
    updateEnemyHealthBar(enemy) {
        if (!enemy.isDead) {
            // Convert 3D position to screen coordinates
            const vector = enemy.mesh.position.clone();
            vector.project(this.player.camera);
            
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
            
            // Only show health bar if enemy is in front of camera
            if (vector.z < 1) {
                enemy.healthBar.style.display = 'block';
                enemy.healthBar.style.left = (x - 50) + 'px';
                enemy.healthBar.style.top = (y - 50) + 'px';
                
                // Update health bar fill
                const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                enemy.healthBarFill.style.width = healthPercent + '%';
            } else {
                enemy.healthBar.style.display = 'none';
            }
        } else {
            enemy.healthBar.style.display = 'none';
        }
    }
    
    updateEnemyAI(enemy) {
        const distanceToPlayer = enemy.body.position.distanceTo(this.player.body.position);
        
        if (distanceToPlayer < GameConfig.ENEMY.CHASE_RANGE && !this.player.isDead) {
            // Chase player
            enemy.state = 'chase';
            
            // Direction to player
            const direction = new CANNON.Vec3();
            direction.copy(this.player.body.position);
            direction.vsub(enemy.body.position, direction);
            direction.normalize();
            
            // Move towards player
            direction.scale(enemy.speed, direction);
            enemy.body.velocity.set(direction.x, enemy.body.velocity.y, direction.z);
            
            // Shoot at player
            if (Date.now() - enemy.lastShot > enemy.fireRate && 
                distanceToPlayer < GameConfig.ENEMY.ATTACK_RANGE) {
                enemy.lastShot = Date.now();
                
                // Create bullet direction towards player
                const bulletDirection = new THREE.Vector3();
                bulletDirection.copy(this.player.body.position);
                bulletDirection.sub(enemy.body.position);
                bulletDirection.normalize();
                
                // Add some inaccuracy
                bulletDirection.x += (Math.random() - 0.5) * 0.2;
                bulletDirection.y += (Math.random() - 0.5) * 0.2;
                bulletDirection.z += (Math.random() - 0.5) * 0.2;
                bulletDirection.normalize();
                
                // Create bullet
                this.createEnemyBullet(enemy, bulletDirection);
            }
        } else {
            // Patrol between target points
            enemy.state = 'patrol';
            
            const target = this.aiTargets[enemy.currentTarget];
            const distanceToTarget = new THREE.Vector3(
                enemy.body.position.x,
                enemy.body.position.y,
                enemy.body.position.z
            ).distanceTo(target);
            
            if (distanceToTarget < 3) {
                // Switch to a new random target
                enemy.currentTarget = Math.floor(Math.random() * this.aiTargets.length);
            } else {
                // Move towards current target
                const direction = new CANNON.Vec3();
                direction.set(
                    target.x - enemy.body.position.x,
                    0,
                    target.z - enemy.body.position.z
                );
                direction.normalize();
                
                // Move towards target
                direction.scale(enemy.speed * 0.6, direction);
                enemy.body.velocity.set(direction.x, enemy.body.velocity.y, direction.z);
            }
        }
    }
    
    createEnemyBullet(enemy, direction) {
        // This will be implemented in the BulletManager class
    }
    
    handleEnemyHit(enemy, damage) {
        enemy.health -= damage;
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }
    
    killEnemy(enemy) {
        enemy.isDead = true;
        enemy.respawnTime = GameConfig.ENEMY.RESPAWN_TIME;
        enemy.mesh.visible = false;
        this.enemiesRemaining--;
        
        if (this.enemiesRemaining <= 0) {
            this.isWaveComplete = true;
            this.waveStartTime = Date.now();
        }
    }
    
    respawnEnemy(enemy) {
        enemy.isDead = false;
        enemy.health = enemy.maxHealth;
        
        // Position randomly
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        enemy.body.position.set(x, 5, z);
        enemy.body.velocity.set(0, 0, 0);
        
        // Show mesh
        enemy.mesh.visible = true;
    }
    
    isWaveComplete() {
        return this.isWaveComplete && 
               Date.now() - this.waveStartTime >= GameConfig.WAVE.BREAK_DURATION * 1000;
    }
} 