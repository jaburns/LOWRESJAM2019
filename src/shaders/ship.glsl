precision highp float;

uniform sampler2D u_tex;
uniform float u_angle;
uniform vec4 u_fire;

varying vec2 v_uv;

#ifdef VERTEX

    attribute vec2 a_position;

    void main()
    {
        gl_Position = vec4(a_position, 0, 1);
        v_uv = a_position.xy*0.5 + 0.5;
    }

#endif
#ifdef FRAGMENT

    vec4 sprite(vec2 uv) 
    {
        float aa = abs(u_angle);

        vec2 bigUV = uv * 8. / 64.;

        if (aa < 3.14159 / 8.) {
        }
        else if (aa < 3.*3.14159 / 8.) {
            bigUV.x += (8. / 64.);
        }
        else if (aa < 5.*3.14159 / 8.) {
            bigUV.x += 2.*(8. / 64.);
        }
        else if (aa < 7.*3.14159 / 8.) {
            bigUV.x += 3.*(8. / 64.);
        }
        else {
            bigUV.x += 4.*(8. / 64.);
        }

        if (u_angle > 0.) {
            bigUV.y += (8. / 64.);
        }

        vec4 color = texture2D(u_tex, bigUV);

        if (color.a > .99 && color.r > .99) {
            bool on = false;

            if      (color.b < .25) on = u_fire.r > .5; 
            else if (color.b < .5)  on = u_fire.g > .5;
            else if (color.b < .75) on = u_fire.b > .5;
            else                    on = u_fire.a > .5;
            
            color = on ? vec4(1,0,0,1) : vec4(0,0,0,0);
        }

        return color;
    }

    void main()
    {
        vec2 px = floor(v_uv * 64.);
        if (px.x > 27.5 && px.x < 35.5 && px.y > 27.5 && px.y < 35.5) {
            gl_FragColor = sprite((px - 28.) / 8.);
        } else {
            gl_FragColor = vec4(0,0,0,0);
        }
    }

#endif
