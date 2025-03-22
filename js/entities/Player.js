import { GameConfig } from '../config/gameConfig.js';

export class Player {
    constructor(scene, world, camera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        
        this.health = GameConfig.PLAYER.HEALTH;
        this.isDead = false;
        this.respawnTimer = 0;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.canJump = false;
        this.isShooting = false;
        
        this.lastFired = 0;
        this.isReloading = false;
        
        this.initialize();
    }
    
    initialize() {
        // Create player mesh
        const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
        const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff });
        this.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Create player physics body
        const playerShape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
        this.body = new CANNON.Body({ mass: 5 });
        this.body.addShape(playerShape);
        this.body.position.set(0, 5, 0);
        this.body.linearDamping = 0.9;
        
        // Create contact material for player
        const playerPhysMaterial = new CANNON.Material("playerMaterial");
        const groundPhysMaterial = new CANNON.Material("groundMaterial");
        this.body.material = playerPhysMaterial;
        
        const playerGroundContact = new CANNON.ContactMaterial(
            groundPhysMaterial,
            playerPhysMaterial,
            { friction: 0.5, restitution: 0.3 }
        );
        this.world.addContactMaterial(playerGroundContact);
        
        // Ground contact detection
        this.body.addEventListener("collide", (e) => {
            const contact = e.contact;
            const contactNormal = new CANNON.Vec3();
            contact.ni.negate(contactNormal);
            
            if (contactNormal.y > 0.5) {
                this.canJump = true;
            }
        });
        
        this.world.addBody(this.body);
    }
    
    reset() {
        this.health = GameConfig.PLAYER.HEALTH;
        this.isDead = false;
        this.respawnTimer = 0;
        
        this.body.position.set(0, 5, 0);
        this.body.velocity.set(0, 0, 0);
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.canJump = false;
        this.isShooting = false;
        
        this.lastFired = 0;
        this.isReloading = false;
    }
    
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.body.velocity.y = GameConfig.PLAYER.JUMP_FORCE;
                    this.canJump = false;
                }
                break;
            case 'ShiftLeft':
                this.isSprinting = true;
                break;
            case 'KeyR':
                this.reloadWeapon();
                break;
        }
    }
    
    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
                this.isSprinting = false;
                break;
        }
    }
    
    handleMouseDown(event) {
        if (event.button === 0) { // Left mouse button
            this.isShooting = true;
        }
    }
    
    handleMouseUp(event) {
        if (event.button === 0) { // Left mouse button
            this.isShooting = false;
        }
    }
    
    handleMouseMove(event) {
        if (document.pointerLockElement === this.scene.parentElement) {
            // Get the camera container
            const container = this.camera.parent;
            
            // Rotate the container horizontally (left/right)
            container.rotation.y -= event.movementX * 0.002;
            
            // Rotate the camera vertically (up/down)
            this.camera.rotation.x -= event.movementY * 0.002;
            
            // Limit vertical look
            this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
        }
    }
    
    update(deltaTime) {
        if (this.isDead) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Get movement direction from camera container
        const direction = new THREE.Vector3(0, 0, 0);
        
        if (this.moveForward) direction.z = -1;
        if (this.moveBackward) direction.z = 1;
        if (this.moveLeft) direction.x = -1;
        if (this.moveRight) direction.x = 1;
        
        // Normalize if moving diagonally
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Apply camera container rotation to movement direction
        direction.applyQuaternion(this.camera.parent.quaternion);
        direction.y = 0; // Keep movement horizontal
        direction.normalize();
        
        // Apply movement force
        const moveSpeed = this.isSprinting ? GameConfig.PLAYER.SPRINT_SPEED : GameConfig.PLAYER.MOVE_SPEED;
        
        this.body.velocity.x = direction.x * moveSpeed;
        this.body.velocity.z = direction.z * moveSpeed;
        
        // Update player mesh rotation based on camera container
        this.mesh.rotation.y = this.camera.parent.rotation.y;
        
        // Update camera container position to follow player
        this.camera.parent.position.x = this.body.position.x;
        this.camera.parent.position.y = this.body.position.y + 1.5;
        this.camera.parent.position.z = this.body.position.z;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isDead = true;
        this.respawnTimer = GameConfig.PLAYER.RESPAWN_TIME;
    }
    
    respawn() {
        this.isDead = false;
        this.health = GameConfig.PLAYER.HEALTH;
        this.body.position.set(0, 5, 0);
        this.body.velocity.set(0, 0, 0);
    }
    
    reloadWeapon() {
        // This will be implemented in the WeaponManager class
    }
} 