precision highp float;

uniform sampler2D u_caveNormals;
uniform sampler2D u_bgNormals;
uniform vec2 u_bgRes;
uniform vec2 u_caveRes;
uniform vec2 u_screenRes;
uniform vec2 u_camera;
uniform float u_time;

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
        vec4 fgColor = texture2D(u_caveNormals, v_uv / 4. + u_time / 20000.);

        if (fgColor.a > .5) {
            gl_FragColor = fgColor;
        } else {
            gl_FragColor = .8 * texture2D(u_bgNormals, v_uv / 4.); //  + u_time / 200000.);
        }
    }

#endif
