import { GameConfig } from '../config/gameConfig.js';

export class BulletManager {
    constructor(scene, player, enemyManager) {
        this.scene = scene;
        this.player = player;
        this.enemyManager = enemyManager;
        
        this.bullets = [];
        this.bulletGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }
    
    reset() {
        // Remove all bullets
        this.bullets.forEach(bullet => {
            this.scene.remove(bullet.mesh);
        });
        this.bullets = [];
    }
    
    createBullet(x, y, z, direction, damage, speed, color, isEnemyBullet = false) {
        const bulletMesh = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
        bulletMesh.material.color.setHex(color);
        bulletMesh.position.set(x, y, z);
        this.scene.add(bulletMesh);
        
        this.bullets.push({
            mesh: bulletMesh,
            direction: direction,
            speed: speed,
            damage: damage,
            lifetime: 2,
            isEnemyBullet: isEnemyBullet
        });
    }
    
    createEnemyBullet(enemy, direction) {
        this.createBullet(
            enemy.body.position.x,
            enemy.body.position.y + 2.5,
            enemy.body.position.z,
            direction,
            enemy.damage,
            30,
            0xFF0000,
            true
        );
    }
    
    update(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update position
            bullet.mesh.position.x += bullet.direction.x * bullet.speed * deltaTime;
            bullet.mesh.position.y += bullet.direction.y * bullet.speed * deltaTime;
            bullet.mesh.position.z += bullet.direction.z * bullet.speed * deltaTime;
            
            // Check if bullet should be removed
            if (this.shouldRemoveBullet(bullet, i)) continue;
            
            // Check for collisions
            if (!bullet.isEnemyBullet) {
                this.checkEnemyCollisions(bullet, i);
            } else if (!this.player.isDead) {
                this.checkPlayerCollision(bullet, i);
            }
        }
    }
    
    shouldRemoveBullet(bullet, index) {
        // Remove if lifetime expired
        bullet.lifetime -= deltaTime;
        if (bullet.lifetime <= 0) {
            this.removeBullet(index);
            return true;
        }
        
        // Remove if out of bounds
        const bulletPos = bullet.mesh.position;
        if (Math.abs(bulletPos.x) > GameConfig.MAP.BOUNDARY || 
            bulletPos.y < 0 || 
            Math.abs(bulletPos.z) > GameConfig.MAP.BOUNDARY) {
            this.removeBullet(index);
            return true;
        }
        
        return false;
    }
    
    removeBullet(index) {
        this.scene.remove(this.bullets[index].mesh);
        this.bullets.splice(index, 1);
    }
    
    checkEnemyCollisions(bullet, bulletIndex) {
        const bulletPos = bullet.mesh.position;
        
        for (let j = 0; j < this.enemyManager.enemies.length; j++) {
            const enemy = this.enemyManager.enemies[j];
            if (enemy.isDead) continue;
            
            if (bulletPos.distanceTo(enemy.body.position) < 1.2) {
                this.removeBullet(bulletIndex);
                this.enemyManager.handleEnemyHit(enemy, bullet.damage);
                break;
            }
        }
    }
    
    checkPlayerCollision(bullet, bulletIndex) {
        if (bullet.mesh.position.distanceTo(this.player.body.position) < 1.2) {
            this.removeBullet(bulletIndex);
            this.player.takeDamage(bullet.damage);
        }
    }
} 