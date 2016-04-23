function Others(main) {
    "use strict";
    var self = this;
    var others = Object.create(null);
    var moveTime = 100;
    var tweenTime = 0.9;
    var lastMove = 0;
    var maxQueueLength = 3;
    var hitSwitchIntervalTime = 500;
    function eachPlayer(fn) {
        var username, player;
        for (username in others) {
            if (!others[username].ready) {
                continue;
            }
            fn(others[username], username);
        }
    }
    function movePlayer(player, destination) {
        console.log("moving to: ", destination);
        player.sprite.x = player.game.x;
        player.sprite.y = player.game.y;

        if (player.sprite.scale.x < 0) {
            player.sprite.scale.x *= -1;
            player.hit_sprite.scale.x *= -1;
        }
        if (destination.x < player.sprite.x) {
            player.lastDirection = 'left';
            player.sprite.animations.play('left');
            player.hit_sprite.animations.play('left');
            player.stillFrame = 3;
            gearLeft(player);
        } else if (destination.x > player.sprite.x) {
            player.lastDirection = 'right';
            if (player.sprite.scale.x > 0) {
                player.sprite.scale.x *= -1;
                player.hit_sprite.scale.x *= -1;
            }
            player.sprite.animations.play('right');
            player.hit_sprite.animations.play('right');
            player.stillFrame = 3;
            gearRight(player);
        } else if (destination.y < player.sprite.y) {
            player.lastDirection = 'up';
            player.sprite.animations.play('up');
            player.hit_sprite.animations.play('up');
            player.stillFrame = 6;
            gearUp(player);
        } else if (destination.y > player.sprite.y) {
            player.lastDirection = 'down';
            player.sprite.animations.play('down');
            player.hit_sprite.animations.play('down');
            player.stillFrame = 0;
            gearDown(player);
        }
        var pTween = main.game.add.tween(player.sprite);
        pTween.to(destination, moveTime * tweenTime, 'Linear');
        pTween.start();
        if (destination.y < player.sprite.y) {
            pTween.onComplete.add(function () {
                //console.log("bottom:", self.player.bottom);
                main.utils.sortUp(player.sprite);
            });
        } else if (destination.y > player.sprite.y) {
            pTween.onComplete.add(function () {
                //console.log("bottom:", self.player.bottom);
                main.utils.sortDown(player.sprite);
            });
        }
        main.game.add.tween(player.text).
            to({
                x: destination.x - 2,
                y: destination.y - 60
            }, moveTime * tweenTime, 'Linear').
            start();
    }
    function cyclePlayerQueues() {
        var destination;
        eachPlayer(function (player) {
            player.hit_sprite.x = player.sprite.x;
            player.hit_sprite.y = player.sprite.y;
            if (player.queue.length > 0) {
                console.log('queue size:', player.queue.length);
                if (player.queue.length > maxQueueLength) {
                    destination = player.queue.pop();
                    player.queue = [];
                } else {
                    destination = player.queue.shift();
                }
                
                movePlayer(player, destination);
                player.game = destination;
            } else {
                if (player.lastDirection === 'right') {
                    if (player.sprite.scale.x > 0) {
                        player.sprite.scale.x *= -1;
                        player.hit_sprite.scale.x *= -1;
                    }
                }
                player.sprite.animations.stop();
                player.hit_sprite.animations.stop();
                player.sprite.frame = player.stillFrame;
                player.hit_sprite.frame = player.stillFrame;
                gearStop(player);
            }
        });
    }

    function hitModeOn (p) {
        p.inHitMode = true;
        p.hit_sprite.revive();
        p.sprite.kill();

        if (p.shirt) {
            p.hit_shirt.revive();
            p.shirt.kill();
        }

        if (p.pants) {
            p.hit_sprite.addChild(p.pants);
        }
    }

    function hitModeOff (p) {
        p.inHitMode = false;
        p.sprite.revive();
        p.hit_sprite.kill();

        if (p.shirt) {
            p.shirt.revive();
            p.hit_shirt.kill();
        }
        if (p.pants) {
            p.sprite.addChild(p.pants);
        }
    }

    function hitModeToggle (p) {
        console.log("HitModeToggle:", p.inHitMode);
        if (p.inHitMode) {
            hitModeOff(p);
        } else {
            hitModeOn(p);
        }
    }

    function startHitMode (p) {
        if (p.hitSwitchInterval === null && !p.inHitMode) {
            console.log("Starting hit mode.");
            hitModeOn(p);
            p.hitSwitchInterval = setInterval(hitModeToggle, hitSwitchIntervalTime, p);
        }
    }

    function stopHitMode (p) {
        if (p.hitSwitchInterval !== null && !p.inHitMode) {
            console.log("Stopping hit mode.");
            clearInterval(p.hitSwitchInterval);
            p.hitSwitchInterval = null;
            hitModeOff(p);
        }
    }

    function destroyGear(p) {
        if (p.shirt) {
            p.shirt.destroy();
            p.hit_shirt.destroy();
        }
        if (p.pants) {
            p.pants.destroy();
        }
    }

    function gearShouldUpdate(p, newGear) {
        if (p.game.gear.shirt.type !== newGear.shirt.type ||
            p.game.gear.pants.type !== newGear.pants.type) {
            return true;
        }
        return false;
    }

    function setUpGear(p) {
        var gear = p.game.gear;
        console.log('other gear:', gear);
        destroyGear(p);
        if (gear.shirt.type === 1) {
            p.shirt = p.sprite.addChild(main.game.add.sprite(0, 0, 'player_shirt'));
            p.shirt.anchor.setTo(0.5, 0.9);

            p.shirt.animations.add('down', [0, 1, 0, 2], 10, true);
            p.shirt.animations.add('left', [3, 4, 3, 5], 10, true);
            p.shirt.animations.add('right', [3, 4, 3, 5], 10, true);
            p.shirt.animations.add('up', [6, 7, 6, 8], 10, true);

            p.shirt.tint = gear.shirt.color;

            p.hit_shirt = p.hit_sprite.addChild(main.game.add.sprite(0, 0, 'player_hit_shirt'));
            p.hit_shirt.anchor.setTo(0.5, 0.9);

            p.hit_shirt.animations.add('down', [0, 1, 0, 2], 10, true);
            p.hit_shirt.animations.add('left', [3, 4, 3, 5], 10, true);
            p.hit_shirt.animations.add('right', [3, 4, 3, 5], 10, true);
            p.hit_shirt.animations.add('up', [6, 7, 6, 8], 10, true);

            p.hit_shirt.tint = gear.shirt.color;
        }
        if (gear.pants.type === 1) {
            p.pants = p.sprite.addChild(main.game.add.sprite(0, 0, 'player_pants'));
            p.pants.anchor.setTo(0.5, 0.9);

            p.pants.animations.add('down', [0, 1, 0, 2], 10, true);
            p.pants.animations.add('left', [3, 4, 3, 5], 10, true);
            p.pants.animations.add('right', [3, 4, 3, 5], 10, true);
            p.pants.animations.add('up', [6, 7, 6, 8], 10, true);

            p.pants.tint = gear.pants.color;
        }
    }

    function gearLeft(p) {
        if (p.shirt) {
            p.shirt.animations.play('left');
            p.hit_shirt.animations.play('left');
        }
        if (p.pants) {
            p.pants.animations.play('left');
        }
    }

    function gearRight(p) {
        if (p.shirt) {
            p.shirt.animations.play('right');
            p.hit_shirt.animations.play('right');
        }
        if (p.pants) {
            p.pants.animations.play('right');
        }
    }

    function gearUp(p) {
        if (p.shirt) {
            p.shirt.animations.play('up');
            p.hit_shirt.animations.play('up');
        }
        if (p.pants) {
            p.pants.animations.play('up');
        }
    }

    function gearDown(p) {
        if (p.shirt) {
            p.shirt.animations.play('down');
            p.hit_shirt.animations.play('down');
        }
        if (p.pants) {
            p.pants.animations.play('down');
        }
    }

    function gearStop(p) {
        if (p.shirt) {
            p.shirt.animations.stop();
            p.shirt.frame = p.stillFrame;
            p.hit_shirt.animations.stop();
            p.hit_shirt.frame = p.stillFrame;
        }
        if (p.pants) {
            p.pants.animations.stop();
            p.pants.frame = p.stillFrame;
        }
    }



    self.update = function () {
        if (lastMove + moveTime < Date.now()) {
            lastMove = Date.now();
            cyclePlayerQueues();
        }
    };
    self.render = function () {};
    comms.on('others-update', function (data) {
        console.log("got other update", data);
        if (!(data.username in others)) {
            others[data.username] = {};
            // Set up player sprite
            others[data.username].sprite = main.objects.create(
                data.game.x, 
                data.game.y, 
                'player'
            );
            others[data.username].sprite.anchor.setTo(0.5, 0.9);
            others[data.username].sprite.animations.add(
                'down', 
                [0, 1, 0, 2], 
                10, 
                true
            );
            others[data.username].sprite.animations.add(
                'left', 
                [3, 4, 3, 5], 
                10, 
                true
            );
            others[data.username].sprite.animations.add(
                'right', 
                [3, 4, 3, 5], 
                10, 
                true
            );
            others[data.username].sprite.animations.add(
                'up', 
                [6, 7, 6, 8], 
                10, 
                true
            );

            others[data.username].hit_sprite = main.objects.create(
                data.game.x, 
                data.game.y, 
                'player_hit'
            );
            others[data.username].hit_sprite.anchor.setTo(0.5, 0.9);
            others[data.username].hit_sprite.animations.add(
                'down', 
                [0, 1, 0, 2], 
                10, 
                true
            );
            others[data.username].hit_sprite.animations.add(
                'left', 
                [3, 4, 3, 5], 
                10, 
                true
            );
            others[data.username].hit_sprite.animations.add(
                'right', 
                [3, 4, 3, 5], 
                10, 
                true
            );
            others[data.username].hit_sprite.animations.add(
                'up', 
                [6, 7, 6, 8], 
                10, 
                true
            );
            others[data.username].hit_sprite.kill();

            // Set up text above player
            others[data.username].text = main.game.add.text(
                data.game.x - 2, 
                data.game.y - 60, 
                data.username
            );
            others[data.username].text.anchor.setTo(0.5);
            others[data.username].text.align = 'center';
            others[data.username].text.font = 'Arial Black';
            others[data.username].text.fontSize = 16;
            others[data.username].text.stroke = '#000000';
            others[data.username].text.strokeThickness = 3;
            others[data.username].text.fill = '#FFFFFF';

            // Set up miscellaneous data for player.
            others[data.username].stillFrame = 0;
            others[data.username].lastDirection = 'down';
            others[data.username].game = data.game;
            others[data.username].queue = [];
            others[data.username].inHitMode = false;
            others[data.username].hitSwitchInterval = null;
            setUpGear(others[data.username]);
            others[data.username].ready = true;
        }
        others[data.username].queue.push(data.game);
        if (data.hitMode) {
            startHitMode(others[data.username]);
        } else {
            stopHitMode(others[data.username]);
        }
        if (gearShouldUpdate(others[data.username], data.game.gear)) {
            console.log('updating other players gear');
            others[data.username].game.gear = data.game.gear;
            setUpGear(others[data.username]);
        }
    });
    comms.on('player-disconnect', function (player) {
        if (others[player] !== void 0) {
            others[player].sprite.destroy();
            others[player].hit_sprite.destroy();
            others[player].text.destroy();
            destroyGear(others[player]);
            delete others[player];
        }
    });
}