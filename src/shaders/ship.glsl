precision highp float;

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

    int sprite(int index) {
        if (index ==  0) return 1;
        if (index ==  1) return 0;
        if (index ==  2) return 0;
        if (index ==  3) return 0;
        if (index ==  4) return 0;
        if (index ==  5) return 1;

        if (index ==  6) return 0;
        if (index ==  7) return 1;
        if (index ==  8) return 0;
        if (index ==  9) return 0;
        if (index == 10) return 1;
        if (index == 11) return 0;

        if (index == 12) return 0;
        if (index == 13) return 0;
        if (index == 14) return 1;
        if (index == 15) return 1;
        if (index == 16) return 0;
        if (index == 17) return 0;

        if (index == 18) return 0;
        if (index == 19) return 0;
        if (index == 20) return 1;
        if (index == 21) return 1;
        if (index == 22) return 0;
        if (index == 23) return 0;

        if (index == 24) return 0;
        if (index == 25) return 1;
        if (index == 26) return 0;
        if (index == 27) return 0;
        if (index == 28) return 1;
        if (index == 29) return 0;

        if (index == 30) return 1;
        if (index == 31) return 0;
        if (index == 32) return 0;
        if (index == 33) return 0;
        if (index == 34) return 0;
        if (index == 35) return 1;

        return 0;
    }

    void main()
    {
        vec2 px = floor(v_uv * 64.);

        if (px.x > 28.5 && px.x < 34.5 && px.y > 28.5 && px.y < 34.5) {
            int x = int(px.x) - 29;
            int y = int(px.y) - 29;
            gl_FragColor = sprite(x+6*y) > 0 ? vec4(.1,1,0,1) : vec4(0,0,0,0);
        } else {
            gl_FragColor = vec4(0,0,0,0);
        }
    }

#endif
