precision highp float;

uniform vec2 u_resolution;

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

    float snoise(vec3 v);
    #define PI 3.14159265358979

    float noiseHeight( vec2 pos, float t )
    {
        pos *= 15.;
        float val = 0.
            + 1.00 * snoise(vec3( 1.*(pos),     t*1.))
            + .500 * snoise(vec3( 2.*(pos), 10.+t*2.))
            + .250 * snoise(vec3( 4.*(pos), 20.+t*4.))
            + .125 * snoise(vec3( 8.*(pos), 30.+t*8.))
            + .0625* snoise(vec3(16.*(pos), 40.+t*16.))
        ;
        float maxValue = 1. + 0.5; // + 0.25 + 0.125 + 0.0625;

        float normVal = 0.5 + 0.5 * val / maxValue;
        return normVal;
    }

    void mainImage2( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 pt = fragCoord / u_resolution.xx;
        float t = 0.; 
        float normVal = noiseHeight(pt, t);
        fragColor = vec4(normVal);
    }

    // =======================================================================================

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;
      i = mod(i, 289.0 );
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 1.0/7.0; // N=7
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }





    vec2 hash2( vec2 p )
    {
        p = mod(p, 8.);
        return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
    }

    vec3 voronoi( in vec2 x )
    {
        vec2 n = floor(x);
        vec2 f = fract(x);

        //----------------------------------
        // first pass: regular voronoi
        //----------------------------------
        vec2 mg, mr;

        float md = 8.0;
        for( int j=-1; j<=1; j++ )
        for( int i=-1; i<=1; i++ )
        {
            vec2 g = vec2(float(i),float(j));
            vec2 o = hash2( n + g );
            vec2 r = g + o - f;
            float d = dot(r,r);

            if( d<md )
            {
                md = d;
                mr = r;
                mg = g;
            }
        }

        //----------------------------------
        // second pass: distance to borders
        //----------------------------------
        md = 8.0;
        for( int j=-2; j<=2; j++ )
        for( int i=-2; i<=2; i++ )
        {
            vec2 g = mg + vec2(float(i),float(j));
            vec2 o = hash2( n + g );
            vec2 r = g + o - f;

            if( dot(mr-r,mr-r)>0.00001 )
            md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
        }

        return vec3( md, mr );
    }

    float rocksHeight( vec2 pt, float scale )
    {
        return voronoi( scale*8.0*pt ).r;
    }

    float rocksCombo( vec2 pt )
    {
        float noiseHeight = 0.; // noiseHeight( 3.*pt, 0. );
        float base = rocksHeight( pt, 1. );
        float smol = rocksHeight( pt.yx + vec2(1.1,1.11), 2. );
        return .7 * (base + .5*smol + .2*noiseHeight);
    }

    vec3 rocksNormal( vec2 pt )
    {
        vec2 dx = vec2(.1,0) / 500.;
        vec2 dy = vec2(0,.1) / 500.;

        float c  = rocksCombo( pt );
        float cx = rocksCombo( pt+dx );
        float cy = rocksCombo( pt+dy );

        vec2 de = vec2(cx-c, cy-c);
        de.y *= -1.;
        de *= 120.;

        return vec3(de, 1. - length(de));
    }

    vec3 noiseNormal( vec3 rocksNorm, vec2 pt )
    {
        vec2 dx = vec2(.1,0) / 500.;
        vec2 dy = vec2(0,.1) / 500.;

        pt += 2. * rocksNorm.xy * length(pt);

        float c  = noiseHeight( pt ,0.);
        float cx = noiseHeight( pt+dx ,0.);
        float cy = noiseHeight( pt+dy ,0.);

        vec2 de = vec2(cx-c, cy-c);
        de.y *= -1.;
        de *= 240.;

        return vec3(de, 1. - length(de));

        return rocksNorm;
    }

    vec3 normalToColor(vec3 normal)
    {
        return 0.5*normal + 0.5;
    }

    void main()
    {
        vec2 pt = v_uv * u_resolution / u_resolution.yy;
        float heightMap = rocksCombo(pt);

        vec3 normal = rocksNormal(pt);
        vec3 noiseNorm = .05*noiseNormal(normal, pt);
        vec3 combinedNorm = normalize(vec3(normal.xy + noiseNorm.xy, normal.z));
        vec3 normalColor = normalToColor(combinedNorm);

        gl_FragColor = vec4(normalColor, 1);
    }

#endif

