var Play = (function () {
    function Play() {
    }
    Play.prototype.init = function () {
        this.score = 0;
        this.timer = this.time.create(false);
        this.scrollSpeed = -200;
        this.itemInterval = { min: 150, max: 200 };
        this.flagCount = 0;
        this.flagInterval = 20;
        this.showDebug = false;
    };
    Play.prototype.create = function () {
        this.game.stage.backgroundColor = 0xffffff;
        this.land = this.game.add.physicsGroup();
        this.player = this.land.create(400, 200, 'skier', 1);
        this.player.name = 'player';
        this.player.anchor.set(0.5, 1);
        this.player.body.setSize(24, 16, 0, -12);
        this.scoreText = this.game.add.bitmapText(16, 0, 'fat-and-tiny', 'SCORE: 0', 32);
        this.scoreText.smoothed = false;
        this.scoreText.tint = 0xff0000;
        this.timer.add(this.itemInterval.max, this.releaseItem, this);
        this.timer.start();
        //  Press P to pause and resume the game
        this.pauseKey = this.game.input.keyboard.addKey(Phaser.Keyboard.P);
        this.pauseKey.onDown.add(this.togglePause, this);
        //  Press D to toggle the debug display
        this.debugKey = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onDown.add(this.toggleDebug, this);
    };
    Play.prototype.togglePause = function () {
        this.game.paused = (this.game.paused) ? false : true;
    };
    Play.prototype.toggleDebug = function () {
        this.showDebug = (this.showDebug) ? false : true;
    };
    Play.prototype.releaseItem = function () {
        var x = this.game.rnd.between(-16, 784);
        var y = 632;
        var item = this.land.getFirstDead();
        if (item && item.name === 'player') {
            item = null;
        }
        //  Are we releasing trees / snow or flags?
        if (this.flagCount === this.flagInterval) {
            //  Flags
            this.releaseFlags(x, y, item);
            this.flagCount = 0;
            this.increaseSpeed();
            //  We don't want any trees spawning in the middle of the flags
            //  Or flags that overlap with any trees, so allow a bit more time after flags
            this.timer.add(500, this.releaseItem, this);
        }
        else {
            //  Snow / Trees
            var type = this.game.rnd.pick(['tree', 'tree', 'snow']);
            if (type === 'tree') {
                this.releaseTree(x, y, item);
            }
            else {
                this.releaseSnow(x, y, item);
            }
            this.timer.add(this.game.rnd.between(this.itemInterval.min, this.itemInterval.max), this.releaseItem, this);
        }
        this.flagCount++;
    };
    Play.prototype.increaseSpeed = function () {
        //  Make things ever so slightly faster
        if (this.itemInterval.min > 50) {
            this.itemInterval.min -= 10;
            this.itemInterval.max -= 10;
        }
        if (this.scrollSpeed > -400) {
            this.scrollSpeed -= 5;
        }
    };
    Play.prototype.releaseFlags = function (x, y, flag1) {
        //  Flags are 150px apart
        //  Stop the flags being too close to the edges
        if (x < 16) {
            x = 16;
        }
        else if (x > 600) {
            x = 600;
        }
        //  Drop them down a little
        y += 32;
        if (flag1) {
            flag1.reset(x, y);
            flag1.loadTexture('flags', 0);
            flag1.body.velocity.y = this.scrollSpeed;
        }
        else {
            flag1 = this.land.create(x, y, 'flags', 0);
            flag1.body.velocity.y = this.scrollSpeed;
        }
        var flag2 = this.land.getFirstDead();
        if (flag2 && flag2.name !== 'player') {
            flag2.reset(x + 150, y);
            flag2.loadTexture('flags', 1);
            flag2.body.velocity.y = this.scrollSpeed;
        }
        else {
            flag2 = this.land.create(x + 150, y, 'flags', 1);
            flag2.body.velocity.y = this.scrollSpeed;
        }
        flag1.anchor.y = 0;
        flag2.anchor.y = 0;
        flag1.body.setSize(134, 16, 16, 0);
        flag2.body.setSize(16, 16, 0, 0);
    };
    Play.prototype.releaseTree = function (x, y, item) {
        if (item) {
            item.reset(x, y);
            item.loadTexture('tree');
            item.body.velocity.y = this.scrollSpeed;
        }
        else {
            item = this.land.create(x, y, 'tree');
            item.body.velocity.y = this.scrollSpeed;
        }
        item.anchor.y = 1;
        item.body.immovable = true;
        item.body.setSize(16, 8, 8, -12);
    };
    Play.prototype.releaseSnow = function (x, y, item) {
        if (item) {
            item.reset(x, y);
            item.loadTexture('snow');
            item.body.velocity.y = this.scrollSpeed;
        }
        else {
            item = this.land.create(x, y, 'snow');
            item.body.velocity.y = this.scrollSpeed;
        }
        item.anchor.y = 0;
        item.body.immovable = false;
        item.body.setSize(16, 16, 0, 0);
    };
    Play.prototype.update = function () {
        this.land.forEachAlive(this.checkY, this);
        this.land.sort('y', Phaser.Group.SORT_ASCENDING);
        if (!this.player.alive) {
            //  No need to poll the collision or controls if the player is dead
            return;
        }
        var d = this.game.physics.arcade.distanceToXY(this.player, this.game.input.activePointer.x, this.player.y) * 2;
        if (this.game.input.x < this.player.x - 16) {
            this.player.body.velocity.x = -d;
            this.player.frame = 0;
        }
        else if (this.game.input.x > this.player.x + 16) {
            this.player.body.velocity.x = d;
            this.player.frame = 2;
        }
        else {
            this.player.frame = 1;
        }
        this.game.physics.arcade.overlap(this.player, this.land, this.collideItem, this.checkCollision, this);
    };
    Play.prototype.checkCollision = function (player, item) {
        //  We only want him to collide with the trees and flags
        return (item.key === 'tree' || (item.key === 'flags' && item.frame === 0));
    };
    Play.prototype.collideItem = function (player, item) {
        if (item.key === 'tree') {
            //  Keep the skis going with players original velocity
            this.skis = this.land.create(player.x, player.y - 16, 'skis');
            this.skis.anchor.set(0.5);
            this.skis.body.velocity.x = player.body.velocity.x * 1.5;
            this.skis.body.velocity.y = player.body.velocity.y;
            if (player.frame > 0) {
                this.skis.scale.x = -1;
            }
            //  Stop further collision checks
            player.alive = false;
            //  Swap player for crashed sprite
            player.frame = 3;
            player.body.velocity.x = 0;
            player.body.velocity.y = this.scrollSpeed;
            //  Start Game Over timer
            this.time.events.add(3000, this.gameOver, this);
        }
        else {
            this.score += 10;
            this.scoreText.text = "SCORE: " + this.score;
            item.body.setSize(16, 16, 0, 0);
        }
    };
    Play.prototype.checkY = function (item) {
        if (item.y < -32) {
            item.kill();
        }
    };
    Play.prototype.gameOver = function () {
        this.game.state.start('MainMenu');
    };
    Play.prototype.shutdown = function () {
        this.timer.stop();
    };
    Play.prototype.render = function () {
        if (this.showDebug) {
            this.land.forEachAlive(this.renderBody, this);
            this.game.debug.text("Pool size: " + this.land.total, 600, 32);
            this.game.debug.text("min: " + this.itemInterval.min + " max: " + this.itemInterval.max, 600, 52);
            this.game.debug.text("scrollSpeed: " + this.scrollSpeed, 600, 72);
        }
    };
    Play.prototype.renderBody = function (sprite) {
        this.game.debug.body(sprite, 'rgba(255,0,255,0.7)');
    };
    return Play;
}());
//# sourceMappingURL=Game.js.map