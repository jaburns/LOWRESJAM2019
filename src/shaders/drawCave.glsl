precision highp float;

uniform sampler2D u_tex;
uniform float u_texRes;
uniform float u_screenRes;
uniform vec2 u_cameraPos;
uniform vec2 u_lightPos;

uniform float u_distScale;
uniform float u_surfaceDepth;
uniform float u_brightness;

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

    vec3 pointLight(vec2 lookupUV, vec3 normal, vec3 color, float brightness, vec2 position)
    {
        vec3 fromLight = vec3(u_distScale*(lookupUV - (.5*position+.5)), u_surfaceDepth);
        vec3 dir = normalize(fromLight);
        float len = length(fromLight);

        float falloff = pow((len / brightness + 1.0), -2.0);
        float intensity = dot(dir, 2.0*normal-1.0);

        return color * intensity * falloff;
    }

    void main()
    {
        vec2 lookupUV = (v_uv - 0.5) * u_screenRes / u_texRes + (.5*u_cameraPos+.5);
        vec4 normalMapLookup = texture2D(u_tex, lookupUV);

        vec3 color = pointLight(lookupUV, normalMapLookup.xyz, vec3(1,1,1), u_brightness, u_lightPos);

        gl_FragColor = vec4(color, normalMapLookup.a);
    }

#endif
