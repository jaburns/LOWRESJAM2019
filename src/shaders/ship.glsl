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

    void main()
    {
        gl_FragColor = length(v_uv - vec2(.5,.5)) < .04 ? vec4(.1,1,0,1) : vec4(0,0,0,0);
    }

#endif
