import { GameConfig } from '../config/gameConfig.js';

export class WeaponManager {
    constructor(scene, player, bulletManager) {
        this.scene = scene;
        this.player = player;
        this.bulletManager = bulletManager;
        
        this.weapons = GameConfig.WEAPONS.map(weapon => ({...weapon}));
        this.currentWeapon = 0;
        this.lastFired = 0;
        this.isReloading = false;
        
        this.initialize();
    }
    
    initialize() {
        // Create weapon mesh
        const weaponGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const weaponMaterial = new THREE.MeshStandardMaterial({ 
            color: this.weapons[this.currentWeapon].color,
            metalness: 0.9,
            roughness: 0.1,
            emissive: this.weapons[this.currentWeapon].color,
            emissiveIntensity: 0.5
        });
        
        this.weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
        this.weaponMesh.position.set(0.6, -0.4, -0.5);
        this.weaponMesh.rotation.z = -Math.PI / 4;
        this.player.mesh.add(this.weaponMesh);
        
        // Create weapon glow
        const glowGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.weapons[this.currentWeapon].color,
            transparent: true,
            opacity: 0.5
        });
        
        this.weaponGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.weaponGlow.position.set(0.8, -0.4, -0.5);
        this.weaponGlow.rotation.z = -Math.PI / 4;
        this.player.mesh.add(this.weaponGlow);
        
        // Update UI
        this.updateWeaponIndicator();
    }
    
    reset() {
        // Reset all weapons to initial state
        this.weapons = GameConfig.WEAPONS.map(weapon => ({...weapon}));
        this.currentWeapon = 0;
        this.lastFired = 0;
        this.isReloading = false;
        
        // Update weapon mesh and UI
        this.updateWeaponMesh();
        this.updateWeaponIndicator();
    }
    
    update(deltaTime) {
        if (this.player.isDead) return;
        
        // Handle continuous shooting
        if (this.player.isShooting) {
            this.shoot();
        }
        
        // Update weapon glow
        if (this.weaponGlow) {
            this.weaponGlow.material.opacity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
        }
    }
    
    shoot() {
        const weapon = this.weapons[this.currentWeapon];
        
        // Check if can fire (not reloading, has ammo, fire rate)
        if (this.isReloading || weapon.ammo <= 0 || Date.now() - this.lastFired < weapon.fireRate) {
            return;
        }
        
        // Update last fired time
        this.lastFired = Date.now();
        
        // Decrease ammo
        weapon.ammo--;
        this.updateWeaponIndicator();
        
        // Get direction by combining camera container and camera rotations
        const direction = new THREE.Vector3(0, 0, -1);
        const combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiplyQuaternions(this.player.camera.parent.quaternion, this.player.camera.quaternion);
        direction.applyQuaternion(combinedQuaternion);
        
        // Create bullet(s)
        if (weapon.isSpread) {
            // Shotgun spread
            for (let i = 0; i < 6; i++) {
                const spreadDirection = direction.clone();
                spreadDirection.x += (Math.random() - 0.5) * 0.2;
                spreadDirection.y += (Math.random() - 0.5) * 0.2;
                spreadDirection.z += (Math.random() - 0.5) * 0.2;
                spreadDirection.normalize();
                
                this.bulletManager.createBullet(
                    this.player.body.position.x,
                    this.player.body.position.y + 2.5,
                    this.player.body.position.z,
                    spreadDirection,
                    weapon.damage / 6, // Divide damage among pellets
                    weapon.bulletSpeed,
                    weapon.color
                );
            }
        } else {
            // Normal weapon
            this.bulletManager.createBullet(
                this.player.body.position.x,
                this.player.body.position.y + 2.5,
                this.player.body.position.z,
                direction,
                weapon.damage,
                weapon.bulletSpeed,
                weapon.color
            );
        }
        
        // Auto reload if empty
        if (weapon.ammo <= 0) {
            this.reload();
        }
    }
    
    reload() {
        const weapon = this.weapons[this.currentWeapon];
        
        // Skip if already reloading or ammo is full
        if (this.isReloading || weapon.ammo >= weapon.maxAmmo) {
            return;
        }
        
        // Start reloading
        this.isReloading = true;
        this.addKillMessage(`Reloading ${weapon.name}...`);
        
        // Set timeout to finish reloading
        setTimeout(() => {
            if (this.player.scene.parent) {
                weapon.ammo = weapon.maxAmmo;
                this.updateWeaponIndicator();
                this.isReloading = false;
            }
        }, weapon.reloadTime);
    }
    
    switchWeapon(index) {
        if (index < 0 || index >= this.weapons.length) return;
        
        this.currentWeapon = index;
        this.updateWeaponMesh();
        this.updateWeaponIndicator();
    }
    
    updateWeaponMesh() {
        const weapon = this.weapons[this.currentWeapon];
        
        // Update weapon mesh color
        this.weaponMesh.material.color.setHex(weapon.color);
        this.weaponMesh.material.emissive.setHex(weapon.color);
        
        // Update weapon glow color
        this.weaponGlow.material.color.setHex(weapon.color);
    }
    
    updateWeaponIndicator() {
        const weapon = this.weapons[this.currentWeapon];
        const weaponIcon = document.getElementById('weaponIcon');
        const weaponName = document.getElementById('weaponName');
        
        // Update weapon icon color
        weaponIcon.style.backgroundColor = '#' + weapon.color.toString(16).padStart(6, '0');
        
        // Set weapon icon text based on weapon type
        if (weapon.isSpread) {
            weaponIcon.textContent = 'S';
        } else if (weapon.fireRate > 1000) {
            weaponIcon.textContent = 'R';
        } else {
            weaponIcon.textContent = 'B';
        }
        
        // Update weapon name with stats
        weaponName.innerHTML = `
            <div>${weapon.name} Lvl ${weapon.level}</div>
            <div class="weapon-stats">
                <span>DMG: ${weapon.damage}</span>
                <span>ROF: ${Math.round(1000/weapon.fireRate)}/s</span>
                <span>AMMO: ${weapon.ammo}/${weapon.maxAmmo}</span>
            </div>
        `;
    }
    
    applyUpgrade(upgradeType) {
        const weapon = this.weapons[this.currentWeapon];
        let upgradeEffect = '';
        
        switch (upgradeType) {
            case 'damage':
                const damageIncrease = weapon.isSpread ? 8 : weapon.fireRate > 1000 ? 15 : 5;
                weapon.damage += damageIncrease;
                upgradeEffect = `Damage +${damageIncrease}`;
                break;
                
            case 'fireRate':
                const newFireRate = Math.max(100, weapon.fireRate - 20);
                const fireRateIncrease = Math.round(1000/weapon.fireRate) - Math.round(1000/newFireRate);
                weapon.fireRate = newFireRate;
                upgradeEffect = `Fire Rate +${fireRateIncrease}/s`;
                break;
                
            case 'ammo':
                weapon.ammo += 2;
                weapon.maxAmmo += 2;
                upgradeEffect = `Ammo +2`;
                break;
                
            case 'reload':
                const oldReloadTime = weapon.reloadTime;
                weapon.reloadTime = Math.max(500, weapon.reloadTime - 200);
                const reduction = Math.round((oldReloadTime - weapon.reloadTime) / oldReloadTime * 100);
                upgradeEffect = `Reload Speed +${reduction}%`;
                break;
        }
        
        // Visual feedback
        this.weaponMesh.material.emissiveIntensity = 1;
        setTimeout(() => {
            this.weaponMesh.material.emissiveIntensity = 0.5;
        }, 1000);
        
        // Update UI
        this.updateWeaponIndicator();
        
        return upgradeEffect;
    }
    
    addKillMessage(message) {
        const killFeed = document.getElementById('killFeed');
        const killMessage = document.createElement('div');
        killMessage.className = 'kill-message';
        killMessage.textContent = message;
        killFeed.appendChild(killMessage);
        
        // Remove message after a few seconds
        setTimeout(() => {
            killFeed.removeChild(killMessage);
        }, GameConfig.UI.KILL_FEED_DURATION);
    }
} 