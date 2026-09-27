/**
 * Catálogo Oficial de Municipios de Guatemala (INE / RENAP)
 * Para validación y detección inteligente de DPI (CUI) de 13 dígitos en Frontend.
 */

export interface MunicipioInfo {
  codigo: string;
  departamentoCodigo: string;
  departamento: string;
  municipio: string;
}

export const MUNICIPIOS_GUATEMALA: Record<string, { departamento: string; municipio: string }> = {
  // 01 - Guatemala
  "0101": { departamento: "Guatemala", municipio: "Guatemala" },
  "0102": { departamento: "Guatemala", municipio: "Santa Catarina Pinula" },
  "0103": { departamento: "Guatemala", municipio: "San José Pinula" },
  "0104": { departamento: "Guatemala", municipio: "San José del Golfo" },
  "0105": { departamento: "Guatemala", municipio: "Palencia" },
  "0106": { departamento: "Guatemala", municipio: "Chinautla" },
  "0107": { departamento: "Guatemala", municipio: "San Pedro Ayampuc" },
  "0108": { departamento: "Guatemala", municipio: "Mixco" },
  "0109": { departamento: "Guatemala", municipio: "San Pedro Sacatepéquez" },
  "0110": { departamento: "Guatemala", municipio: "San Juan Sacatepéquez" },
  "0111": { departamento: "Guatemala", municipio: "San Raymundo" },
  "0112": { departamento: "Guatemala", municipio: "Chuarrancho" },
  "0113": { departamento: "Guatemala", municipio: "Fraijanes" },
  "0114": { departamento: "Guatemala", municipio: "Amatitlán" },
  "0115": { departamento: "Guatemala", municipio: "Villa Nueva" },
  "0116": { departamento: "Guatemala", municipio: "Villa Canales" },
  "0117": { departamento: "Guatemala", municipio: "San Miguel Petapa" },

  // 02 - El Progreso
  "0201": { departamento: "El Progreso", municipio: "Guastatoya" },
  "0202": { departamento: "El Progreso", municipio: "Morazán" },
  "0203": { departamento: "El Progreso", municipio: "San Agustín Acasaguastlán" },
  "0204": { departamento: "El Progreso", municipio: "San Cristóbal Acasaguastlán" },
  "0205": { departamento: "El Progreso", municipio: "El Jícaro" },
  "0206": { departamento: "El Progreso", municipio: "Sansare" },
  "0207": { departamento: "El Progreso", municipio: "Sanarate" },
  "0208": { departamento: "El Progreso", municipio: "San Antonio La Paz" },

  // 03 - Sacatepéquez
  "0301": { departamento: "Sacatepéquez", municipio: "Antigua Guatemala" },
  "0302": { departamento: "Sacatepéquez", municipio: "Jocotenango" },
  "0303": { departamento: "Sacatepéquez", municipio: "Pastores" },
  "0304": { departamento: "Sacatepéquez", municipio: "Sumpango" },
  "0305": { departamento: "Sacatepéquez", municipio: "Santo Domingo Xenacoj" },
  "0306": { departamento: "Sacatepéquez", municipio: "Santiago Sacatepéquez" },
  "0307": { departamento: "Sacatepéquez", municipio: "San Bartolomé Milpas Altas" },
  "0308": { departamento: "Sacatepéquez", municipio: "San Lucas Sacatepéquez" },
  "0309": { departamento: "Sacatepéquez", municipio: "Santa Lucía Milpas Altas" },
  "0310": { departamento: "Sacatepéquez", municipio: "Magdalena Milpas Altas" },
  "0311": { departamento: "Sacatepéquez", municipio: "Santa María de Jesús" },
  "0312": { departamento: "Sacatepéquez", municipio: "Ciudad Vieja" },
  "0313": { departamento: "Sacatepéquez", municipio: "San Miguel Dueñas" },
  "0314": { departamento: "Sacatepéquez", municipio: "Alotenango" },
  "0315": { departamento: "Sacatepéquez", municipio: "San Antonio Aguas Calientes" },
  "0316": { departamento: "Sacatepéquez", municipio: "Santa Catarina Barahona" },

  // 04 - Chimaltenango
  "0401": { departamento: "Chimaltenango", municipio: "Chimaltenango" },
  "0402": { departamento: "Chimaltenango", municipio: "San José Poaquil" },
  "0403": { departamento: "Chimaltenango", municipio: "San Martín Jilotepeque" },
  "0404": { departamento: "Chimaltenango", municipio: "San Juan Comalapa" },
  "0405": { departamento: "Chimaltenango", municipio: "Santa Apolonia" },
  "0406": { departamento: "Chimaltenango", municipio: "Tecpán Guatemala" },
  "0407": { departamento: "Chimaltenango", municipio: "Patzún" },
  "0408": { departamento: "Chimaltenango", municipio: "Pochuta" },
  "0409": { departamento: "Chimaltenango", municipio: "Patzicía" },
  "0410": { departamento: "Chimaltenango", municipio: "Santa Cruz Balanyá" },
  "0411": { departamento: "Chimaltenango", municipio: "Acatenango" },
  "0412": { departamento: "Chimaltenango", municipio: "Yepocapa" },
  "0413": { departamento: "Chimaltenango", municipio: "San Andrés Itzapa" },
  "0414": { departamento: "Chimaltenango", municipio: "Parramos" },
  "0415": { departamento: "Chimaltenango", municipio: "Zaragoza" },
  "0416": { departamento: "Chimaltenango", municipio: "El Tejar" },

  // 05 - Escuintla
  "0501": { departamento: "Escuintla", municipio: "Escuintla" },
  "0502": { departamento: "Escuintla", municipio: "Santa Lucía Cotzumalguapa" },
  "0503": { departamento: "Escuintla", municipio: "La Democracia" },
  "0504": { departamento: "Escuintla", municipio: "Siquinalá" },
  "0505": { departamento: "Escuintla", municipio: "Masagua" },
  "0506": { departamento: "Escuintla", municipio: "Tiquisate" },
  "0507": { departamento: "Escuintla", municipio: "La Gomera" },
  "0508": { departamento: "Escuintla", municipio: "Guanagazapa" },
  "0509": { departamento: "Escuintla", municipio: "San José" },
  "0510": { departamento: "Escuintla", municipio: "Iztapa" },
  "0511": { departamento: "Escuintla", municipio: "Palín" },
  "0512": { departamento: "Escuintla", municipio: "San Vicente Pacaya" },
  "0513": { departamento: "Escuintla", municipio: "Nueva Concepción" },
  "0514": { departamento: "Escuintla", municipio: "Sipacate" },

  // 06 - Santa Rosa
  "0601": { departamento: "Santa Rosa", municipio: "Cuilapa" },
  "0602": { departamento: "Santa Rosa", municipio: "Barberena" },
  "0603": { departamento: "Santa Rosa", municipio: "Santa Rosa de Lima" },
  "0604": { departamento: "Santa Rosa", municipio: "Casillas" },
  "0605": { departamento: "Santa Rosa", municipio: "San Rafael Las Flores" },
  "0606": { departamento: "Santa Rosa", municipio: "Oratorio" },
  "0607": { departamento: "Santa Rosa", municipio: "San Juan Tecuaco" },
  "0608": { departamento: "Santa Rosa", municipio: "Chiquimulilla" },
  "0609": { departamento: "Santa Rosa", municipio: "Taxisco" },
  "0610": { departamento: "Santa Rosa", municipio: "Santa María Ixhuatán" },
  "0611": { departamento: "Santa Rosa", municipio: "Guazacapán" },
  "0612": { departamento: "Santa Rosa", municipio: "Santa Cruz Naranjo" },
  "0613": { departamento: "Santa Rosa", municipio: "Pueblo Nuevo Viñas" },
  "0614": { departamento: "Santa Rosa", municipio: "Nueva Santa Rosa" },

  // 07 - Sololá
  "0701": { departamento: "Sololá", municipio: "Sololá" },
  "0702": { departamento: "Sololá", municipio: "San José Chacayá" },
  "0703": { departamento: "Sololá", municipio: "Santa María Visitación" },
  "0704": { departamento: "Sololá", municipio: "Santa Lucía Utatlán" },
  "0705": { departamento: "Sololá", municipio: "Nahualá" },
  "0706": { departamento: "Sololá", municipio: "Santa Catarina Ixtahuacán" },
  "0707": { departamento: "Sololá", municipio: "Santa Clara La Laguna" },
  "0708": { departamento: "Sololá", municipio: "Concepción" },
  "0709": { departamento: "Sololá", municipio: "San Andrés Semetabaj" },
  "0710": { departamento: "Sololá", municipio: "Panajachel" },
  "0711": { departamento: "Sololá", municipio: "Santa Catarina Palopó" },
  "0712": { departamento: "Sololá", municipio: "San Antonio Palopó" },
  "0713": { departamento: "Sololá", municipio: "San Lucas Tolimán" },
  "0714": { departamento: "Sololá", municipio: "Santa Cruz La Laguna" },
  "0715": { departamento: "Sololá", municipio: "San Pablo La Laguna" },
  "0716": { departamento: "Sololá", municipio: "San Marcos La Laguna" },
  "0717": { departamento: "Sololá", municipio: "San Juan La Laguna" },
  "0718": { departamento: "Sololá", municipio: "San Pedro La Laguna" },
  "0719": { departamento: "Sololá", municipio: "Santiago Atitlán" },

  // 08 - Totonicapán
  "0801": { departamento: "Totonicapán", municipio: "Totonicapán" },
  "0802": { departamento: "Totonicapán", municipio: "San Cristóbal Totonicapán" },
  "0803": { departamento: "Totonicapán", municipio: "San Francisco El Alto" },
  "0804": { departamento: "Totonicapán", municipio: "San Andrés Xecul" },
  "0805": { departamento: "Totonicapán", municipio: "Momostenango" },
  "0806": { departamento: "Totonicapán", municipio: "Santa María Chiquimula" },
  "0807": { departamento: "Totonicapán", municipio: "Santa Lucía La Reforma" },
  "0808": { departamento: "Totonicapán", municipio: "San Bartolo" },

  // 09 - Quetzaltenango
  "0901": { departamento: "Quetzaltenango", municipio: "Quetzaltenango" },
  "0902": { departamento: "Quetzaltenango", municipio: "Salcajá" },
  "0903": { departamento: "Quetzaltenango", municipio: "Olintepeque" },
  "0904": { departamento: "Quetzaltenango", municipio: "San Carlos Sija" },
  "0905": { departamento: "Quetzaltenango", municipio: "Sibilia" },
  "0906": { departamento: "Quetzaltenango", municipio: "Cabricán" },
  "0907": { departamento: "Quetzaltenango", municipio: "Cajolá" },
  "0908": { departamento: "Quetzaltenango", municipio: "San Miguel Sigüilá" },
  "0909": { departamento: "Quetzaltenango", municipio: "San Juan Ostuncalco" },
  "0910": { departamento: "Quetzaltenango", municipio: "San Mateo" },
  "0911": { departamento: "Quetzaltenango", municipio: "Concepción Chiquirichapa" },
  "0912": { departamento: "Quetzaltenango", municipio: "San Martín Sacatepéquez" },
  "0913": { departamento: "Quetzaltenango", municipio: "Almolonga" },
  "0914": { departamento: "Quetzaltenango", municipio: "Cantel" },
  "0915": { departamento: "Quetzaltenango", municipio: "Huitán" },
  "0916": { departamento: "Quetzaltenango", municipio: "Zunil" },
  "0917": { departamento: "Quetzaltenango", municipio: "Colomba Costa Cuca" },
  "0918": { departamento: "Quetzaltenango", municipio: "San Francisco La Unión" },
  "0919": { departamento: "Quetzaltenango", municipio: "El Palmar" },
  "0920": { departamento: "Quetzaltenango", municipio: "Coatepeque" },
  "0921": { departamento: "Quetzaltenango", municipio: "Génova" },
  "0922": { departamento: "Quetzaltenango", municipio: "Flores Costa Cuca" },
  "0923": { departamento: "Quetzaltenango", municipio: "La Esperanza" },
  "0924": { departamento: "Quetzaltenango", municipio: "Palestina de Los Altos" },

  // 10 - Suchitepéquez
  "1001": { departamento: "Suchitepéquez", municipio: "Mazatenango" },
  "1002": { departamento: "Suchitepéquez", municipio: "Cuyotenango" },
  "1003": { departamento: "Suchitepéquez", municipio: "San Francisco Zapotitlán" },
  "1004": { departamento: "Suchitepéquez", municipio: "San Bernardino" },
  "1005": { departamento: "Suchitepéquez", municipio: "San José El Idolo" },
  "1006": { departamento: "Suchitepéquez", municipio: "Santo Domingo Suchitepéquez" },
  "1007": { departamento: "Suchitepéquez", municipio: "San Lorenzo" },
  "1008": { departamento: "Suchitepéquez", municipio: "Samayac" },
  "1009": { departamento: "Suchitepéquez", municipio: "San Pablo Jocopilas" },
  "1010": { departamento: "Suchitepéquez", municipio: "San Antonio Suchitepéquez" },
  "1011": { departamento: "Suchitepéquez", municipio: "San Miguel Panán" },
  "1012": { departamento: "Suchitepéquez", municipio: "San Gabriel" },
  "1013": { departamento: "Suchitepéquez", municipio: "Chicacao" },
  "1014": { departamento: "Suchitepéquez", municipio: "Patulul" },
  "1015": { departamento: "Suchitepéquez", municipio: "Santa Bárbara" },
  "1016": { departamento: "Suchitepéquez", municipio: "San Juan Bautista" },
  "1017": { departamento: "Suchitepéquez", municipio: "Santo Tomás La Unión" },
  "1018": { departamento: "Suchitepéquez", municipio: "Zunilito" },
  "1019": { departamento: "Suchitepéquez", municipio: "Pueblo Nuevo" },
  "1020": { departamento: "Suchitepéquez", municipio: "Río Bravo" },
  "1021": { departamento: "Suchitepéquez", municipio: "San José La Máquina" },

  // 11 - Retalhuleu
  "1101": { departamento: "Retalhuleu", municipio: "Retalhuleu" },
  "1102": { departamento: "Retalhuleu", municipio: "San Sebastián" },
  "1103": { departamento: "Retalhuleu", municipio: "Santa Cruz Muluá" },
  "1104": { departamento: "Retalhuleu", municipio: "San Martín Zapotitlán" },
  "1105": { departamento: "Retalhuleu", municipio: "San Felipe" },
  "1106": { departamento: "Retalhuleu", municipio: "San Andrés Villa Seca" },
  "1107": { departamento: "Retalhuleu", municipio: "Champerico" },
  "1108": { departamento: "Retalhuleu", municipio: "Nuevo San Carlos" },
  "1109": { departamento: "Retalhuleu", municipio: "El Asintal" },

  // 12 - San Marcos
  "1201": { departamento: "San Marcos", municipio: "San Marcos" },
  "1202": { departamento: "San Marcos", municipio: "San Pedro Sacatepéquez" },
  "1203": { departamento: "San Marcos", municipio: "San Antonio Sacatepéquez" },
  "1204": { departamento: "San Marcos", municipio: "Comitancillo" },
  "1205": { departamento: "San Marcos", municipio: "San Miguel Ixtahuacán" },
  "1206": { departamento: "San Marcos", municipio: "Concepción Tutuapa" },
  "1207": { departamento: "San Marcos", municipio: "Tacaná" },
  "1208": { departamento: "San Marcos", municipio: "Sibinal" },
  "1209": { departamento: "San Marcos", municipio: "Tajumulco" },
  "1210": { departamento: "San Marcos", municipio: "Tejutla" },
  "1211": { departamento: "San Marcos", municipio: "San Rafael Pie de la Cuesta" },
  "1212": { departamento: "San Marcos", municipio: "Nuevo Progreso" },
  "1213": { departamento: "San Marcos", municipio: "El Tumbador" },
  "1214": { departamento: "San Marcos", municipio: "El Rodeo" },
  "1215": { departamento: "San Marcos", municipio: "Malacatán" },
  "1216": { departamento: "San Marcos", municipio: "Catarina" },
  "1217": { departamento: "San Marcos", municipio: "Ayutla" },
  "1218": { departamento: "San Marcos", municipio: "Ocós" },
  "1219": { departamento: "San Marcos", municipio: "San Pablo" },
  "1220": { departamento: "San Marcos", municipio: "El Quetzal" },
  "1221": { departamento: "San Marcos", municipio: "La Reforma" },
  "1222": { departamento: "San Marcos", municipio: "Pajapita" },
  "1223": { departamento: "San Marcos", municipio: "Ixchiguán" },
  "1224": { departamento: "San Marcos", municipio: "San José Ojetenam" },
  "1225": { departamento: "San Marcos", municipio: "San Cristóbal Cucho" },
  "1226": { departamento: "San Marcos", municipio: "Sipacapa" },
  "1227": { departamento: "San Marcos", municipio: "Esquipulas Palo Gordo" },
  "1228": { departamento: "San Marcos", municipio: "Río Blanco" },
  "1229": { departamento: "San Marcos", municipio: "San Lorenzo" },
  "1230": { departamento: "San Marcos", municipio: "La Blanca" },

  // 13 - Huehuetenango
  "1301": { departamento: "Huehuetenango", municipio: "Huehuetenango" },
  "1302": { departamento: "Huehuetenango", municipio: "Chiantla" },
  "1303": { departamento: "Huehuetenango", municipio: "Malacatancito" },
  "1304": { departamento: "Huehuetenango", municipio: "Cuilco" },
  "1305": { departamento: "Huehuetenango", municipio: "Nentón" },
  "1306": { departamento: "Huehuetenango", municipio: "San Pedro Necta" },
  "1307": { departamento: "Huehuetenango", municipio: "Jacaltenango" },
  "1308": { departamento: "Huehuetenango", municipio: "San Pedro Soloma" },
  "1309": { departamento: "Huehuetenango", municipio: "San Ildefonso Ixtahuacán" },
  "1310": { departamento: "Huehuetenango", municipio: "Santa Bárbara" },
  "1311": { departamento: "Huehuetenango", municipio: "La Libertad" },
  "1312": { departamento: "Huehuetenango", municipio: "La Democracia" },
  "1313": { departamento: "Huehuetenango", municipio: "San Miguel Acatán" },
  "1314": { departamento: "Huehuetenango", municipio: "San Rafael La Independencia" },
  "1315": { departamento: "Huehuetenango", municipio: "Todos Santos Cuchumatán" },
  "1316": { departamento: "Huehuetenango", municipio: "San Juan Atitán" },
  "1317": { departamento: "Huehuetenango", municipio: "Santa Eulalia" },
  "1318": { departamento: "Huehuetenango", municipio: "San Mateo Ixtatán" },
  "1319": { departamento: "Huehuetenango", municipio: "Colotenango" },
  "1320": { departamento: "Huehuetenango", municipio: "San Sebastián Huehuetenango" },
  "1321": { departamento: "Huehuetenango", municipio: "Tectitán" },
  "1322": { departamento: "Huehuetenango", municipio: "Concepción Huista" },
  "1323": { departamento: "Huehuetenango", municipio: "San Juan Ixcoy" },
  "1324": { departamento: "Huehuetenango", municipio: "San Antonio Huista" },
  "1325": { departamento: "Huehuetenango", municipio: "San Sebastián Coatán" },
  "1326": { departamento: "Huehuetenango", municipio: "Santa Cruz Barillas" },
  "1327": { departamento: "Huehuetenango", municipio: "Aguacatán" },
  "1328": { departamento: "Huehuetenango", municipio: "San Rafael Petzal" },
  "1329": { departamento: "Huehuetenango", municipio: "San Gaspar Ixchil" },
  "1330": { departamento: "Huehuetenango", municipio: "Santiago Chimaltenango" },
  "1331": { departamento: "Huehuetenango", municipio: "Santa Ana Huista" },
  "1332": { departamento: "Huehuetenango", municipio: "Unión Cantinil" },
  "1333": { departamento: "Huehuetenango", municipio: "Petatán" },

  // 14 - Quiché
  "1401": { departamento: "Quiché", municipio: "Santa Cruz del Quiché" },
  "1402": { departamento: "Quiché", municipio: "Chiché" },
  "1403": { departamento: "Quiché", municipio: "Chinique" },
  "1404": { departamento: "Quiché", municipio: "Zacualpa" },
  "1405": { departamento: "Quiché", municipio: "San Juan Chajul" },
  "1406": { departamento: "Quiché", municipio: "Santo Tomás Chichicastenango" },
  "1407": { departamento: "Quiché", municipio: "Patzité" },
  "1408": { departamento: "Quiché", municipio: "San Antonio Ilotenango" },
  "1409": { departamento: "Quiché", municipio: "San Pedro Jocopilas" },
  "1410": { departamento: "Quiché", municipio: "Cunén" },
  "1411": { departamento: "Quiché", municipio: "San Juan Cotzal" },
  "1412": { departamento: "Quiché", municipio: "Joyabaj" },
  "1413": { departamento: "Quiché", municipio: "Santa María Nebaj" },
  "1414": { departamento: "Quiché", municipio: "San Andrés Sajcabajá" },
  "1415": { departamento: "Quiché", municipio: "Uspantán" },
  "1416": { departamento: "Quiché", municipio: "Sacapulas" },
  "1417": { departamento: "Quiché", municipio: "San Bartolomé Jocotenango" },
  "1418": { departamento: "Quiché", municipio: "Canillá" },
  "1419": { departamento: "Quiché", municipio: "Chicamán" },
  "1420": { departamento: "Quiché", municipio: "Ixcán (Playa Grande)" },
  "1421": { departamento: "Quiché", municipio: "Pachalum" },

  // 15 - Baja Verapaz
  "1501": { departamento: "Baja Verapaz", municipio: "Salamá" },
  "1502": { departamento: "Baja Verapaz", municipio: "San Miguel Chicaj" },
  "1503": { departamento: "Baja Verapaz", municipio: "Rabinal" },
  "1504": { departamento: "Baja Verapaz", municipio: "Cubulco" },
  "1505": { departamento: "Baja Verapaz", municipio: "Granados" },
  "1506": { departamento: "Baja Verapaz", municipio: "Santa Cruz El Chol" },
  "1507": { departamento: "Baja Verapaz", municipio: "San Jerónimo" },
  "1508": { departamento: "Baja Verapaz", municipio: "Purulhá" },

  // 16 - Alta Verapaz
  "1601": { departamento: "Alta Verapaz", municipio: "Cobán" },
  "1602": { departamento: "Alta Verapaz", municipio: "Santa Cruz Verapaz" },
  "1603": { departamento: "Alta Verapaz", municipio: "San Cristóbal Verapaz" },
  "1604": { departamento: "Alta Verapaz", municipio: "Tactic" },
  "1605": { departamento: "Alta Verapaz", municipio: "Tamahú" },
  "1606": { departamento: "Alta Verapaz", municipio: "San Pedro Carchá" },
  "1607": { departamento: "Alta Verapaz", municipio: "San Juan Chamelco" },
  "1608": { departamento: "Alta Verapaz", municipio: "Lanquín" },
  "1609": { departamento: "Alta Verapaz", municipio: "Santa María Cahabón" },
  "1610": { departamento: "Alta Verapaz", municipio: "Chisec" },
  "1611": { departamento: "Alta Verapaz", municipio: "Chahal" },
  "1612": { departamento: "Alta Verapaz", municipio: "Fray Bartolomé de las Casas" },
  "1613": { departamento: "Alta Verapaz", municipio: "Santa Catarina La Tinta" },
  "1614": { departamento: "Alta Verapaz", municipio: "Raxruhá" },
  "1615": { departamento: "Alta Verapaz", municipio: "San Miguel Tucurú" },
  "1616": { departamento: "Alta Verapaz", municipio: "Panzós" },
  "1617": { departamento: "Alta Verapaz", municipio: "Senahú" },

  // 17 - Petén
  "1701": { departamento: "Petén", municipio: "Flores" },
  "1702": { departamento: "Petén", municipio: "San José" },
  "1703": { departamento: "Petén", municipio: "San Benito" },
  "1704": { departamento: "Petén", municipio: "San Andrés" },
  "1705": { departamento: "Petén", municipio: "La Libertad" },
  "1706": { departamento: "Petén", municipio: "San Francisco" },
  "1707": { departamento: "Petén", municipio: "Santa Ana" },
  "1708": { departamento: "Petén", municipio: "Dolores" },
  "1709": { departamento: "Petén", municipio: "San Luis" },
  "1710": { departamento: "Petén", municipio: "Sayaxché" },
  "1711": { departamento: "Petén", municipio: "Melchor de Mencos" },
  "1712": { departamento: "Petén", municipio: "Poptún" },
  "1713": { departamento: "Petén", municipio: "Las Cruces" },
  "1714": { departamento: "Petén", municipio: "El Chal" },

  // 18 - Izabal
  "1801": { departamento: "Izabal", municipio: "Puerto Barrios" },
  "1802": { departamento: "Izabal", municipio: "Livingston" },
  "1803": { departamento: "Izabal", municipio: "El Estor" },
  "1804": { departamento: "Izabal", municipio: "Morales" },
  "1805": { departamento: "Izabal", municipio: "Los Amates" },

  // 19 - Zacapa
  "1901": { departamento: "Zacapa", municipio: "Zacapa" },
  "1902": { departamento: "Zacapa", municipio: "Estanzuela" },
  "1903": { departamento: "Zacapa", municipio: "Río Hondo" },
  "1904": { departamento: "Zacapa", municipio: "Gualán" },
  "1905": { departamento: "Zacapa", municipio: "Teculután" },
  "1906": { departamento: "Zacapa", municipio: "Usumatlán" },
  "1907": { departamento: "Zacapa", municipio: "Cabañas" },
  "1908": { departamento: "Zacapa", municipio: "San Diego" },
  "1909": { departamento: "Zacapa", municipio: "La Unión" },
  "1910": { departamento: "Zacapa", municipio: "Huité" },
  "1911": { departamento: "Zacapa", municipio: "San Jorge" },

  // 20 - Chiquimula
  "2001": { departamento: "Chiquimula", municipio: "Chiquimula" },
  "2002": { departamento: "Chiquimula", municipio: "San José La Arada" },
  "2003": { departamento: "Chiquimula", municipio: "San Juan Ermita" },
  "2004": { departamento: "Chiquimula", municipio: "Jocotán" },
  "2005": { departamento: "Chiquimula", municipio: "Camotán" },
  "2006": { departamento: "Chiquimula", municipio: "Olopa" },
  "2007": { departamento: "Chiquimula", municipio: "Esquipulas" },
  "2008": { departamento: "Chiquimula", municipio: "Concepción Las Minas" },
  "2009": { departamento: "Chiquimula", municipio: "Quetzaltepeque" },
  "2010": { departamento: "Chiquimula", municipio: "San Jacinto" },
  "2011": { departamento: "Chiquimula", municipio: "Ipala" },

  // 21 - Jalapa
  "2101": { departamento: "Jalapa", municipio: "Jalapa" },
  "2102": { departamento: "Jalapa", municipio: "San Pedro Pinula" },
  "2103": { departamento: "Jalapa", municipio: "San Luis Jilotepeque" },
  "2104": { departamento: "Jalapa", municipio: "San Manuel Chaparrón" },
  "2105": { departamento: "Jalapa", municipio: "San Carlos Alzatate" },
  "2106": { departamento: "Jalapa", municipio: "Monjas" },
  "2107": { departamento: "Jalapa", municipio: "Mataquescuintla" },

  // 22 - Jutiapa
  "2201": { departamento: "Jutiapa", municipio: "Jutiapa" },
  "2202": { departamento: "Jutiapa", municipio: "El Progreso" },
  "2203": { departamento: "Jutiapa", municipio: "Santa Catarina Mita" },
  "2204": { departamento: "Jutiapa", municipio: "Agua Blanca" },
  "2205": { departamento: "Jutiapa", municipio: "Asunción Mita" },
  "2206": { departamento: "Jutiapa", municipio: "Yupiltepeque" },
  "2207": { departamento: "Jutiapa", municipio: "Atescatempa" },
  "2208": { departamento: "Jutiapa", municipio: "Jerez" },
  "2209": { departamento: "Jutiapa", municipio: "El Adelanto" },
  "2210": { departamento: "Jutiapa", municipio: "Zapotitlán" },
  "2211": { departamento: "Jutiapa", municipio: "Comapa" },
  "2212": { departamento: "Jutiapa", municipio: "Jalpatagua" },
  "2213": { departamento: "Jutiapa", municipio: "Conguaco" },
  "2214": { departamento: "Jutiapa", municipio: "Moyuta" },
  "2215": { departamento: "Jutiapa", municipio: "Pasaco" },
  "2216": { departamento: "Jutiapa", municipio: "San José Acatempa" },
  "2217": { departamento: "Jutiapa", municipio: "Quezada" },
};

export const CODIGOS_AGENCIA: Record<string, { codigoMuni: string; nombre: string }> = {
  CHAJUL: { codigoMuni: "1405", nombre: "Agencia Chajul (1405 - Chajul, Quiché)" },
  NEBAJ: { codigoMuni: "1413", nombre: "Agencia Nebaj (1413 - Santa María Nebaj, Quiché)" },
  ACUL: { codigoMuni: "1413", nombre: "Agencia Acul (1413 - Nebaj/Acul, Quiché)" },
};

export function limpiarDPI(dpi: string | null | undefined): string {
  if (!dpi) return "";
  return dpi.replace(/\D/g, "");
}

export function formatearDPI(dpi: string | null | undefined): string {
  const digits = limpiarDPI(dpi);
  if (digits.length !== 13) return dpi?.trim() || "";
  return `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9, 13)}`;
}

export interface ResultadoValidacionDPI {
  valido: boolean;
  mensaje?: string;
  codigoMunicipio?: string;
  municipio?: string;
  departamento?: string;
  esLocal?: boolean;
  advertencia?: string;
  dpiFormateado?: string;
}

export function validarDpiGuatemala(dpi: string | null | undefined, agenciaCodigo?: string): ResultadoValidacionDPI {
  const raw = limpiarDPI(dpi);

  if (!raw) {
    return { valido: false, mensaje: "El DPI es requerido." };
  }

  if (raw.length !== 13) {
    return {
      valido: false,
      mensaje: `DPI incompleto o con longitud errónea: tiene ${raw.length} dígitos (debe tener exactamente 13 dígitos).`,
    };
  }

  const codMuni = raw.slice(9, 13);
  const infoMuni = MUNICIPIOS_GUATEMALA[codMuni];

  if (!infoMuni) {
    return {
      valido: false,
      mensaje: `La terminación "${codMuni}" no corresponde a ningún municipio oficial de Guatemala.`,
    };
  }

  const dpiFormateado = `${raw.slice(0, 4)} ${raw.slice(4, 9)} ${codMuni}`;
  const codAgencia = agenciaCodigo?.trim().toUpperCase();
  const agenciaEsperada = codAgencia ? CODIGOS_AGENCIA[codAgencia] : undefined;

  let esLocal = true;
  let advertencia: string | undefined = undefined;

  if (agenciaEsperada && agenciaEsperada.codigoMuni !== codMuni) {
    esLocal = false;
    advertencia = `Asociado de otro municipio: DPI emitido en ${infoMuni.municipio}, ${infoMuni.departamento} (Terminación ${codMuni}).`;
  }

  return {
    valido: true,
    codigoMunicipio: codMuni,
    municipio: infoMuni.municipio,
    departamento: infoMuni.departamento,
    esLocal,
    advertencia,
    dpiFormateado,
  };
}
