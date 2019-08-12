precision highp float;

uniform sampler2D u_tex;
uniform float u_bgRes;
uniform float u_screenRes;
uniform vec2 u_camera;
uniform float u_time;
uniform float u_fireLevel;

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
        vec2 lookupUV = (v_uv - .5) * u_screenRes / u_bgRes + u_camera;
        vec4 normalMapLookup = texture2D(u_tex, lookupUV);

        vec2 fromCam = lookupUV - u_camera;
        float dist = .5*length(fromCam);
        vec2 dir = normalize(fromCam);

        float radialAmount = clamp(1.2*(1. - dist*2.*u_bgRes/u_screenRes), 0.4, 1.);
        float angleAmount = dot(dir, 2.*normalMapLookup.xy-1.);
        vec3 colorA = vec3(1,1,1) * angleAmount * radialAmount * radialAmount;

        float radialAmountB = clamp(.8*(1. - dist*4.*u_bgRes/u_screenRes), 0.1, 1.);
        float angleAmountB = dot(dir, 2.*normalMapLookup.xy-1.);
        vec3 colorB = vec3(1,0,0) * angleAmountB * radialAmountB * radialAmountB;

        vec3 color = .5 * (.4*colorA + u_fireLevel*colorB);

        gl_FragColor = vec4(color, normalMapLookup.a);
    }

#endif
