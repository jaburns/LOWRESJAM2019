precision highp float;

uniform sampler2D u_tex;
uniform float u_uvScale;
uniform float u_texRes;
uniform float u_parallax;
uniform float u_distScale;
uniform vec2 u_cameraPos;

uniform float u_baseLightDistance;
uniform float u_brightnessMultiplier;

uniform vec4 u_lightInfo0;
uniform vec4 u_lightInfo1;

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

    vec3 colorForIndex(float index)
    {
        if (index < 0.5) return vec3(1,1,1);
        if (index < 1.5) return vec3(1,0,0);
    }

    vec3 pointLight(vec2 lookupUV, vec3 normal, vec3 color, float brightness, vec2 position, float depth)
    {
        vec3 fromLight = vec3(u_distScale*(lookupUV - (.5*position+.5)), depth);
        vec3 dir = normalize(fromLight);
        float len = length(fromLight);

        float falloff = pow((len / brightness + 1.0), -2.0);
        float intensity = clamp(dot(dir, 2.0*normal-1.0), 0., 1.);

        return color * intensity * falloff;
    }

    vec4 cavePointLight(vec2 lookupUV, vec2 vuv, vec3 normie, vec4 lightInfo)
    {
        vec2 lightPos = (lightInfo.xy - u_cameraPos) * u_parallax + u_cameraPos;
        vec3 litColor = pointLight(lookupUV, normie, colorForIndex(floor(lightInfo.w)), u_brightnessMultiplier*fract(lightInfo.w), lightPos, clamp(u_baseLightDistance + lightInfo.z,0.,100.));
        return vec4(litColor, 1);
    }

    vec4 caveAllLights(vec2 lookupUV, vec2 vuv, vec3 normie)
    {
        return cavePointLight(lookupUV, vuv, normie, u_lightInfo0)
            + cavePointLight(lookupUV, vuv, normie, u_lightInfo1);
    }

    void main()
    {
        vec2 lookupUV = (v_uv - 0.5) * SCREEN_RES / u_texRes + (.5*u_cameraPos+.5);
        vec4 normalMapLookup = texture2D(u_tex, u_uvScale * lookupUV);
        gl_FragColor = vec4(caveAllLights(lookupUV, v_uv, normalMapLookup.xyz).xyz, normalMapLookup.a);
    }

#endif
