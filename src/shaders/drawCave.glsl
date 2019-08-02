precision highp float;

uniform sampler2D u_depth;
uniform sampler2D u_normal;
uniform sampler2D u_normalRocks;
uniform mat4 u_perspective;

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

    mat3 axisAngle(vec3 normalizedAxis, float angle)
    {
        float x = normalizedAxis.x;
        float y = normalizedAxis.y;
        float z = normalizedAxis.z;
        float s = sin(angle);
        float c = cos(angle);
        float t = 1. - c;

        return mat3(
            t*x*x + c   , t*x*y - z*s , t*x*z + y*s ,
            t*x*y + z*s , t*y*y + c   , t*y*z - x*s ,
            t*x*z - y*s , t*y*z + x*s , t*z*z + c
        );
    }

    void main()
    {
        vec2 surfDir = 2.*texture2D(u_normal, v_uv).rg - 1.;
        float surfDepth = clamp(1.- texture2D(u_depth, v_uv).r, 0., 1.);
        surfDepth *= surfDepth;

        vec2 uv1 = v_uv - surfDir*asin(surfDepth*0.05);
        vec2 lookup = uv1;
        lookup.x = 1. - lookup.x;
        lookup.y = 1. - lookup.y;
        vec2 normalRocks2d = 2.*texture2D(u_normalRocks, 2.*lookup + .02*surfDir*surfDepth).rg - 1.;
        normalRocks2d *= -1.;
        vec3 normalRocks = normalize(vec3(normalRocks2d, 1. - length(normalRocks2d)));

        normalRocks = axisAngle(normalize(vec3(surfDir.y, -surfDir.x, 0)), 4.*surfDepth) * normalRocks;

        gl_FragColor = vec4(.5+normalRocks*.5, 1);
    }

#endif