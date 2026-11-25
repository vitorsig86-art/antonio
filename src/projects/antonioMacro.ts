import { microbasinColors } from "./template";
import type { LayerSource, MacroPopupPreset, ProjectLayerConfig } from "./types";

type GeoStyle = NonNullable<Extract<LayerSource, { format: "geojson" }>["style"]>;
const baseUrl = "https://pub-87a0f753169b4f8ab3f276d52702c8c7.r2.dev/geojson/analise-macro";
const rasterBaseUrl = "https://pub-87a0f753169b4f8ab3f276d52702c8c7.r2.dev";
const territorial = "Contexto territorial";
const physical = "Caracterização física — IBGE";
const relief = "Relevo e hidrologia";

// Estilos por tema das referências Andrelândia/EFAC, sem atribuir classes novas.
function polygon(color: string, fillOpacity: number, strokeWidth = 1.5): GeoStyle {
  return { stroke: color, fill: color, fillOpacity, strokeWidth, clampToGround: true, zIndex: 1 };
}

function macro(file: string, name: string, subsection: string, panelOrder: number,
  macroPopup: MacroPopupPreset, style: GeoStyle, credit: string): ProjectLayerConfig {
  return {
    id: `macro-${file}`, name, description: "Contextualização territorial regional.",
    kind: "vector", group: "macro", subsection, panelOrder,
    defaultVisible: false, opacityControl: true,
    source: {
      format: "geojson", url: `${baseUrl}/${file}.geojson`,
      autoZoom: false, credit, macroPopup, style,
    },
  };
}

export const antonioMacroLayers: ProjectLayerConfig[] = [
  {
    id: "macro-dem",
    name: "Modelo Digital de Elevação — Macro",
    description: "Representação cartográfica regional do relevo.",
    kind: "raster", group: "macro", subsection: relief, panelOrder: 0,
    defaultVisible: false, opacityControl: true,
    source: {
      format: "tms",
      url: `${rasterBaseUrl}/dem_macro/{z}/{x}/{reverseY}.png`,
      credit: "Cardeal Map",
      bounds: [-47.8125, -24.527134822597496, -45, -21.94304553343772],
      minimumLevel: 7, maximumLevel: 16, tileWidth: 256, tileHeight: 256,
    },
  },
  macro("areas_urbanizadas", "Áreas Urbanizadas", territorial, 11,
    "urban-areas", polygon("#D49B36", 0.18), "Áreas urbanizadas — arquivo fornecido"),
  macro("info_municipio", "Informações Municipais", territorial, 12,
    "municipality", polygon("#6C7E89", 0.02, 2), "Contexto municipal — arquivo fornecido"),
  macro("clima_ibge", "Clima — IBGE", physical, 6,
    "climate", polygon("#28A7C9", 0.12), "IBGE"),
  macro("geologia_ibge", "Geologia — IBGE", physical, 7,
    "geology", polygon("#94745E", 0.18, 2), "IBGE"),
  macro("geomorfologia_ibge", "Geomorfologia — IBGE", physical, 8,
    "geomorphology", polygon("#BA9D50", 0.18), "IBGE"),
  macro("pedologia_ibge", "Pedologia — IBGE", physical, 9,
    "soils", polygon("#B48357", 0.2), "IBGE"),
  macro("vegetacao_ibge", "Vegetação — IBGE", physical, 10,
    "vegetation", polygon("#398D57", 0.2), "IBGE"),
  macro("limite_microbacias_ana", "Microbacias — ANA", relief, 1,
    "ana-basin", polygon("#8053BD", 0.025, 2.2), "ANA"),
  macro("curvas_8m", "Curvas de Nível — 8 m", relief, 2,
    "elevation-contours", { stroke: "#111111", strokeWidth: 0.65, clampToGround: true, zIndex: 10 },
    "Curvas de nível — arquivo fornecido"),
  macro("drenagem_ana", "Drenagem — ANA", relief, 3,
    "ana-hydrography", {
      stroke: "#163C80", strokeWidth: 2.3, clampToGround: true, zIndex: 13,
      classification: { property: "nuordemcda", classes: {
        "5": { strokeWidth: 2.3 }, "6": { strokeWidth: 3 }, "7": { strokeWidth: 3.7 },
      } },
    }, "ANA"),
  {
    id: "simu_drenagem",
    name: "Drenagem Simulada",
    description: "",
    kind: "drainage", group: "macro", subsection: relief, panelOrder: 4,
    defaultVisible: false, opacityControl: true,
    source: {
      format: "geojson",
      url: "https://pub-87a0f753169b4f8ab3f276d52702c8c7.r2.dev/geojson/vetores-micro/simu_drenagem.geojson",
      autoZoom: false,
      symbology: "simulated-drainage-strahler",
      popup: {
        title: "Drenagem Simulada — Drenagem potencial derivada de modelagem digital do terreno.",
        fields: [
          { property: "nome", label: "Nome" },
          { property: "STRAHLER", label: "Ordem de Strahler" },
          { property: "area_contribuicao_ha", label: "Área de contribuição", suffix: " ha" },
        ],
      },
    },
  },
  {
    id: "simu_microbacias",
    name: "Microbacias Simuladas",
    description: "",
    kind: "vector", group: "macro", subsection: relief, panelOrder: 5,
    defaultVisible: false, opacityControl: true,
    source: {
      format: "geojson",
      url: "https://pub-87a0f753169b4f8ab3f276d52702c8c7.r2.dev/geojson/vetores-micro/simu_microbacias.geojson",
      autoZoom: false,
      style: {
        stroke: "#FFFFFF", fill: "#FFFFFF", strokeWidth: 1.5, fillOpacity: 0.35,
        clampToGround: true, zIndex: 3, featurePalette: microbasinColors,
      },
      popup: {
        title: "Microbacias Simuladas",
        fields: [
          { property: "nome", label: "Nome" },
          { property: "area_contribuicao_ha", label: "Área de contribuição", suffix: " ha" },
          { property: "area_ha", label: "Área", suffix: " ha" },
          { property: "perimetro_km", label: "Perímetro", suffix: " km" },
        ],
      },
    },
  },
];
