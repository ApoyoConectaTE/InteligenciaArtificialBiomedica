const credencial =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSlHsVNAaRPFH09XhOFSvtZfh-FhbHlcV2XP5mkYUoH7vLAHMIl3cxn5LIxVvAXLQ/pub?gid=680415088&single=true&output=csv";

const cursos =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSlHsVNAaRPFH09XhOFSvtZfh-FhbHlcV2XP5mkYUoH7vLAHMIl3cxn5LIxVvAXLQ/pub?gid=1215013168&single=true&output=csv";

window.addEventListener("DOMContentLoaded", init);

const loaderElem = document.querySelector(".loader");
const credencialTituloElem = document.querySelector("#credencialTitulo");
const credencialCreditosElem = document.querySelector("#credencialCreditos");
const credencialLogroElem = document.querySelector("#credencialLogro");
const credencialJustificacionElem = document.querySelector("#credencialJustificacion");
const credencialCriteriosElem = document.querySelector("#credencialCriterios");
const tabsContainerElem = document.querySelector("#tabs-container");

let infoCredencial;
let infoCursos;

function parseCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: (result) => resolve(result),
      error: (err) => reject(err),
    });
  });
}

async function init() {
  try {
    const [credencialData, cursosData] = await Promise.all([parseCSV(credencial), parseCSV(cursos)]);

    if (credencialData.errors.length || cursosData.errors.length) {
      console.error("Error parsing CSV data:", credencialData.errors, cursosData.errors);
      credencialTituloElem.innerHTML = "Error al cargar los datos.";
      hideLoader();
      return;
    }

    printInfo(credencialData.data, cursosData.data);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    credencialTituloElem.innerHTML = "No se pudieron cargar los datos. Revisa la conexión.";
    hideLoader();
  }
}

function printInfo(credencial, cursos) {
  if (credencial != null || cursos != null) {
    credencialTituloElem.innerHTML = credencial[0].Nombre;
    credencialCreditosElem.innerHTML = credencial[0].Creditos;
    credencialLogroElem.innerHTML = credencial[0].Logro;
    credencialJustificacionElem.innerHTML = createLi(credencial[0].Justificacion);
    credencialCriterios.innerHTML = credencial[0].Criterios;

    // 1. Agrupar cursos por agrupador
    const cursosPorAgrupador = cursos.reduce((acc, curso) => {
      const grupo = curso.Agrupador || "Sin Agrupador";
      if (!acc[grupo]) {
        acc[grupo] = [];
      }
      acc[grupo].push(curso);
      return acc;
    }, {});

    // 2. Generar HTML para las pestañas horizontales (agrupadores)
    let groupTabsHTML = '<div class="col-12 horizontal-tabs">';
    let groupLabelsHTML = '<div class="horizontal-tab-labels">';
    let groupContentsHTML = '<div class="horizontal-tab-contents">';

    Object.keys(cursosPorAgrupador).forEach((grupo, groupIndex) => {
      const groupId = `group-${groupIndex}`;
      const isFirstGroup = groupIndex === 0;

      // Input y Label para la pestaña del agrupador
      groupLabelsHTML += `<input type="radio" id="${groupId}" name="group-tabs" ${isFirstGroup ? "checked" : ""}>`;
      groupLabelsHTML += `<label for="${groupId}">${grupo}</label>`;

      let courseLabels = '<div class="tab-labels col-4 p-r-3 m-b-3">';
      let courseContents = '<div class="col-8">';
      const cursosDelGrupo = cursosPorAgrupador[grupo];

      // Generar pestañas verticales para los cursos de este agrupador
      cursosDelGrupo.forEach((curso, courseIndex) => {
        const courseId = `${groupId}-course-${courseIndex}`;
        const isFirstCourse = courseIndex === 0;
        courseLabels += createRadio(courseId, `course-tabs-${groupId}`, isFirstCourse);
        courseLabels += createLabel(courseId, curso);
        courseContents += createContent(courseId, curso, `course-tabs-${groupId}`);
      });

      courseLabels += "</div>";
      courseContents += "</div>";

      // Contenido de la pestaña del agrupador (que contendrá las pestañas de cursos)
      groupContentsHTML += `<div id="content-${groupId}" class="horizontal-tab-content">`;
      groupContentsHTML += `<div class="tabs row">${courseLabels}${courseContents}</div>`;
      groupContentsHTML += `</div>`;
    });
    groupLabelsHTML += "</div>";
    groupContentsHTML += "</div>";
    groupTabsHTML += groupLabelsHTML + groupContentsHTML + "</div>";

    tabsContainerElem.innerHTML = groupTabsHTML;
    hideLoader();
    addTabEventListeners();
    addCourseTabListeners();
  }
}

function addTabEventListeners() {
  const groupRadios = document.querySelectorAll('input[name="group-tabs"]');
  const groupContents = document.querySelectorAll(".horizontal-tab-content");

  groupRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      groupContents.forEach((content) => {
        content.style.display = "none";
        content.classList.remove("is-active");
      });

      const contentId = `content-${radio.id}`;
      const activeContent = document.getElementById(contentId);
      if (activeContent) activeContent.style.display = "block";
      if (activeContent) activeContent.classList.add("is-active");
    });
  });

  const checkedRadio = document.querySelector('input[name="group-tabs"]:checked');
  if (checkedRadio) {
    checkedRadio.dispatchEvent(new Event("change"));
  }
}

function addCourseTabListeners() {
  // Selecciona todos los contenedores de pestañas de cursos
  const courseTabContainers = document.querySelectorAll(".horizontal-tab-content .tabs");

  courseTabContainers.forEach((container) => {
    const courseRadios = container.querySelectorAll('input[name^="course-tabs-"]');
    const courseContents = container.querySelectorAll(".tab-content");

    courseRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        // Dentro de este grupo, oculta todos los contenidos
        courseContents.forEach((content) => (content.style.display = "none"));
        courseContents.forEach((content) => content.classList.remove("is-active"));

        // Muestra el contenido correspondiente al radio seleccionado
        const contentId = `content-${radio.id}`;
        const activeContent = container.querySelector(`#${contentId}`);
        if (activeContent) activeContent.style.display = "block";
        if (activeContent) activeContent.classList.add("is-active");
      });
    });

    // Activa la primera pestaña de cada grupo al cargar
    const firstRadio = container.querySelector('input[name^="course-tabs-"]');
    if (firstRadio) firstRadio.dispatchEvent(new Event("change"));
  });
}

function createContent(id, curso, groupName) {
  let content = `
    <div id="content-${id}" class="tab-content is-active">
              <h1 class="lined m-b-2">${curso.Nombre}</h1>
              <h2 class="icon left m-b-2"><img src="img/icons/icon-obtiene.png" alt=""> Descripción</h2>
              <p class="m-b-2">${curso.Descripcion}</p>
              <p ><strong>Nivel: </strong>${curso.Nivel}</p>
              <p class="m-b-2"><strong>Prerequisito: </strong>${curso.Prerequisito}</p>
              <div class="metadata">
                <div class="metadata-item ">
                  <div class="credits border">
                    <h2 class="p-t-1">${curso.Creditos}</h2>
                    <span class="${curso.Requisito} p-x-1">Créditos</span>
                  </div>
                </div>
                <div class="metadata-item ${curso.Requisito}">
                  <p class="m-b-1"><b>Curso obligatorio o electivo</b></p>
                  <div class="color">
                    ${curso.Requisito}
                  </div>
                </div>
                <div class="metadata-item">
                  <p class="m-b-1"><b>Facultad(es)</b></p>
                  <div>${curso.Facultad}</div>
                </div>
              </div>
              <div class="m-y-3">
                <details name="accordion-group-2" class="m-b-3">
                  <summary>
                    <h3>Resultados de aprendizaje</h3>
                    <span class="arrow">
                      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false"
                        fill="currentColor" aria-hidden="true" viewBox="0 0 24 24" data-testid="KeyboardArrowDownIcon">
                        <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path>
                      </svg>
                    </span>
                  </summary>
                  <div class="content p-y-2">
                    <ul>
                      ${createLi(curso.Objetivos)}
                    </ul>
                  </div>
                </details>
                <details name="accordion-group-2" class="m-b-3">
                  <summary>
                    <h3>Metodología</h3>
                    <span class="arrow">
                      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false"
                        fill="currentColor" aria-hidden="true" viewBox="0 0 24 24" data-testid="KeyboardArrowDownIcon">
                        <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path>
                      </svg>
                    </span>
                  </summary>
                  <div class="content p-y-2">
                    <p class="m-b-2">${curso.Metodologia}</p>
                  </div>
                </details>
                <details name="accordion-group-2" class="m-b-2">
                  <summary>
                    <h3>Aportes al proyecto integrador</h3>
                    <span class="arrow">
                      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false"
                        fill="currentColor" aria-hidden="true" viewBox="0 0 24 24" data-testid="KeyboardArrowDownIcon">
                        <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path>
                      </svg>
                    </span>
                  </summary>
                  <div class="content p-y-2">
                    <p class="m-b-2">${curso.Aportes}</p>
                  </div>
                </details>
              </div>
            </div>
  `;
  return content;
}

function createLabel(id, curso) {
  let labelElement = `
    <label for="${id}" class="border">
                <h5 class="number ${curso.Requisito} m-0">${curso.Orden}</h5>
                <p>${curso.Nombre}</p>
                <div class="actions">
                  <span class="ca">
                    <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false"
                      fill="currentColor" aria-hidden="true" viewBox="0 0 24 24" data-testid="KeyboardArrowDownIcon">
                      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path>
                    </svg>
                  </span>
                  <span>+</span>
                </div>
              </label>
  `;

  return labelElement;
}

function insertBefore(el, htmlString) {
  el.insertAdjacentHTML("beforebegin", htmlString);
}

function insertAfter(el, htmlString) {
  el.insertAdjacentHTML("afterEnd", htmlString);
}

function createRadio(id, name, isChecked = false) {
  return `<input type="radio" id="${id}" name="${name}" ${isChecked ? "checked" : ""}>`;
}

function createLi(data) {
  if (!data) return "";
  let datasplit = data.split("|");
  let liElements = "";
  datasplit.forEach((string) => {
    liElements += `<li>${string}</li>`;
  });
  return liElements;
}

function hideLoader() {
  loaderElem.style.top = "-100vw";
  setTimeout(() => {
    loaderElem.style.zIndex = 0;
    loaderElem.style.display = "none";
  }, 800);
}
