const vertex = `#version 300 es
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec2 aNormal;
 
uniform float healthIn;

uniform vec3 highlightedColor;

uniform mat4 uViewModel;
uniform mat4 uProjection;

uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;

uniform float uShininess;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uLightAttenuation;

out vec2 vTexCoord;
out float health;
out vec3 iHighlightedColor;

out vec3 vLight;

void main() {
    vec3 vertexPosition = (uViewModel * aPosition).xyz;
    vec3 lightPosition = (uViewModel * vec4(uLightPosition, 1)).xyz;
    float d = distance(vertexPosition, lightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation, vec3(1, d, d * d));

    vec3 N = (uViewModel * vec4(aNormal,0, 0)).xyz;
    vec3 L = normalize(lightPosition - vertexPosition);
    vec3 E = normalize(-vertexPosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N));
    float phong = pow(max(0.0, dot(E, R)), uShininess);

    float ambient = uAmbient;
    float diffuse = uDiffuse * lambert;
    float specular = uSpecular * phong;

    vLight = ((ambient + diffuse + specular) * attenuation) * uLightColor;
    health = healthIn;
    vTexCoord = aTexCoord;
    gl_Position = uProjection * uViewModel * aPosition;

    iHighlightedColor = highlightedColor; 
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec3 iHighlightedColor;
in vec2 vTexCoord;
in vec3 vLight;
in float health;

out vec4 oColor;

void main() {
    vec4 tColor = texture(uTexture, vTexCoord);
    // oColor = mix(vec4(255, 0, 0, 1), tColor, health);
    if (health < 0.20){
      oColor = mix(vec4(170, tColor.g * health, tColor.b * health, 1), tColor, health) * vec4(vLight, 1);
    } else {
      oColor = mix(vec4(255, tColor.g * health, tColor.b * health, 1), tColor, health) * vec4(vLight, 1);
    }

    oColor *= vec4(iHighlightedColor, 1);
}
`;

export const shaders = {
  simple: { vertex, fragment },
};
