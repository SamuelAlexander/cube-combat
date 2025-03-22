export const GameConfig = {
    // Game settings
    GAME_TITLE: "CUBE COMBAT",
    GAME_DESCRIPTION: "A fast-paced browser FPS game",
    WIN_CONDITION: {
        KILLS_REQUIRED: 20
    },
    
    // Player settings
    PLAYER: {
        HEALTH: 100,
        MOVE_SPEED: 10,
        SPRINT_SPEED: 20,
        JUMP_FORCE: 10,
        RESPAWN_TIME: 3
    },
    
    // Wave settings
    WAVE: {
        BASE_ENEMY_COUNT: 3,
        ENEMY_HEALTH_INCREASE: 20,
        ENEMY_DAMAGE_INCREASE: 2,
        ENEMY_SPEED_INCREASE: 0.5,
        ENEMY_FIRE_RATE_DECREASE: 50,
        BREAK_DURATION: 5
    },
    
    // Weapon settings
    WEAPONS: [
        {
            name: "Cube Blaster",
            damage: 20,
            fireRate: 200,
            ammo: 30,
            maxAmmo: 30,
            reloadTime: 1500,
            bulletSpeed: 50,
            color: 0x00ffff,
            level: 1,
            description: "Balanced weapon with good fire rate"
        },
        {
            name: "Voxel Shotgun",
            damage: 40,
            fireRate: 333,
            ammo: 6,
            maxAmmo: 6,
            reloadTime: 2000,
            bulletSpeed: 40,
            isSpread: true,
            color: 0xff0000,
            level: 1,
            description: "Close range powerhouse"
        },
        {
            name: "Pixel Sniper",
            damage: 90,
            fireRate: 1500,
            ammo: 5,
            maxAmmo: 5,
            reloadTime: 2500,
            bulletSpeed: 70,
            color: 0xffff00,
            level: 1,
            description: "Long range precision weapon"
        }
    ],
    
    // Enemy settings
    ENEMY: {
        BASE_HEALTH: 100,
        BASE_DAMAGE: 10,
        BASE_SPEED: 5,
        BASE_FIRE_RATE: 1200,
        CHASE_RANGE: 20,
        ATTACK_RANGE: 15,
        RESPAWN_TIME: 5
    },
    
    // Map settings
    MAP: {
        SIZE: 100,
        BOUNDARY: 40,
        GRASS_COLOR: 0x90EE90,
        SKY_COLOR: 0x87CEEB,
        FOG_DENSITY: 500
    },
    
    // Physics settings
    PHYSICS: {
        GRAVITY: -20,
        SOLVER_ITERATIONS: 10
    },
    
    // UI settings
    UI: {
        HEALTH_BAR_WIDTH: 200,
        HEALTH_BAR_HEIGHT: 20,
        KILL_FEED_DURATION: 3000
    }
}; 