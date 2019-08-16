precision highp float;

uniform sampler2D u_tex;
uniform float u_uvScale;
uniform float u_texRes;
uniform float u_parallax;
uniform float u_distScale;
uniform vec2 u_cameraPos;

uniform float u_baseLightDistance;
uniform float u_brightnessMultiplier;
uniform vec4 u_lightInfo;

varying vec2 v_uv;

#define SCREEN_RES 64.0

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
        vec3 fromLight = vec3(u_distScale*(lookupUV - (.5*position+.5)), (u_baseLightDistance + u_lightInfo.z));
        vec3 dir = normalize(fromLight);
        float len = length(fromLight);

        float falloff = pow((len / brightness + 1.0), -2.0);
        float intensity = dot(dir, 2.0*normal-1.0);

        return color * intensity * falloff;
    }

    vec4 cavePointLight(vec2 lookupUV, vec2 vuv, vec3 normie)
    {
        vec2 lightPos = (u_lightInfo.xy - u_cameraPos) * u_parallax + u_cameraPos;
        vec3 litColor = pointLight(lookupUV, normie, vec3(1,1,1), u_brightnessMultiplier*fract(u_lightInfo.w), lightPos);
        return vec4(litColor, 1);
    }

    void main()
    {
        vec2 lookupUV = (v_uv - 0.5) * SCREEN_RES / u_texRes + (.5*u_cameraPos+.5);
        vec4 normalMapLookup = texture2D(u_tex, u_uvScale * lookupUV);
        gl_FragColor = vec4(cavePointLight(lookupUV, v_uv, normalMapLookup.xyz).xyz, normalMapLookup.a);
    }

#endif
