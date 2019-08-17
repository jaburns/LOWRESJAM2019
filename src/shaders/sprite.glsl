precision highp float;

uniform sampler2D u_tex;
uniform sampler2D u_normMap;
uniform vec2 u_spriteLookup;
uniform vec4 u_fire;

uniform vec2 u_cameraPos;
uniform vec2 u_spritePos;

uniform float u_baseLightDistance;

uniform vec4 u_lightInfo0;
uniform vec4 u_lightInfo1;

varying vec2 v_uv;

#define SCREEN_RES 64.0

#define u_distScale 4.0

#define SHEET_WIDTH 64.0
#define SPRITE_WIDTH 8.0

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

    vec4 spritePointLight(vec2 vuv, vec3 normie, vec4 lightInfo)
    {
        vec2 lookupUV = (v_uv - 0.5) * SCREEN_RES / 512.0 + (.5*u_cameraPos+.5);
        vec2 lightPos = (lightInfo.xy - u_cameraPos) * 1. + u_cameraPos;
        vec3 litColor = pointLight(lookupUV, normie, colorForIndex(floor(lightInfo.w)), fract(lightInfo.w), lightPos, clamp(u_baseLightDistance + lightInfo.z,0.,100.));
        return vec4(litColor, 1);
    }

    vec4 spriteAllLights(vec2 vuv, vec3 normie)
    {
        return spritePointLight(vuv, normie, u_lightInfo0)
            + spritePointLight(vuv, normie, u_lightInfo1);
    }

    vec4 sprite(sampler2D map, vec2 uv, out bool skip) 
    {
        skip = false;

        vec4 color = texture2D(map, (uv + u_spriteLookup) * SPRITE_WIDTH / SHEET_WIDTH);

        if (u_fire.r > -0.5 && color.a > .99 && color.r > .99 && color.g < .01) {
            bool on = false;

            if      (color.b < .25) on = u_fire.r > .5; 
            else if (color.b < .5)  on = u_fire.g > .5;
            else if (color.b < .75) on = u_fire.b > .5;
            else                    on = u_fire.a > .5;
            
            color = on ? vec4(1,.7,.7,1) : vec4(0,0,0,0);
            skip = true;
        }

        return color;
    }

    void main()
    {
     // vec2 lookupUV = (v_uv - 0.5) * SCREEN_RES / u_texRes + (.5*u_cameraPos+.5);

     // vec2 pixelCoordinate

        float lower = 32.0 - (SPRITE_WIDTH + 1.0) / 2.0; 
        float upper = 32.0 + (SPRITE_WIDTH - 1.0) / 2.0; 

        vec2 px = floor((v_uv + 4.*(u_cameraPos - u_spritePos)) * SHEET_WIDTH);

        if (px.x > lower && px.x < upper && px.y > lower && px.y < upper)
        {
            vec2 spriteUV = (px - ceil(lower)) / SPRITE_WIDTH;

            bool skip;

            vec3 normie = sprite(u_normMap, spriteUV, skip).xyz;
            normie.x = 1.0 - normie.x;

            vec4 albedo = sprite(u_tex, spriteUV, skip);

            if (u_fire.r > -0.5 && skip) {
                gl_FragColor = albedo;
                return;
            }

            vec4 litColor = spriteAllLights(v_uv, normie);

            gl_FragColor = albedo * litColor;
            return;
        } 

        gl_FragColor = vec4(0,0,0,0);
    }

#endif
