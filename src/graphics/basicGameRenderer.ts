import { Cave } from "caveGenerator";
import { GameState, GameSceneState } from "gameplay/state";
import { vec2 } from "gl-matrix";

export class BasicGameRenderer {
    private readonly ctx: CanvasRenderingContext2D;
    
    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
    }

    draw(state: GameSceneState) {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#222';

        const f = (v:vec2) => ([
            (v[0] + 1) * ctx.canvas.width / 2,
            (v[1] + 1) * ctx.canvas.height / 2,
        ]);

        ctx.beginPath();
        state.cave.edges.forEach(blob => {
            const f0 = f(blob[0]);
            ctx.moveTo(f0[0], f0[1]);

            for (let i = 1; i < blob.length; ++i) {
                const fi = f(blob[i]);
                ctx.lineTo(fi[0], fi[1]);
            }

            ctx.fill();
        });

        const fp = f(state.playerPos);

        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(fp[0], fp[1], 1, 0, 2*Math.PI);
        ctx.fill();

        /*
        state.cave.placements.enemies.forEach((v:vec2) => {
            ctx.beginPath();
            ctx.arc(f(v)[0], f(v)[1], 1.5, 0, 2*Math.PI);
            ctx.fill();
        });
        */

        {
            const vvv = state.cave.placements.door;

            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(f(vvv)[0], f(vvv)[1], 1.5, 0, 2*Math.PI);
            ctx.fill();
        }
    }
}