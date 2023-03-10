import React from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import * as Environment from '../env.js';
import { LoadingSpinnerComponent } from "../loader/LoadingSpinnerComponent.js";
import Timer from "../timer/Timer.js";

class Surveys extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            surveyReplyId: 0,
            currentSlide: 0,
            questions: [],
            questionsDiv: [],
            survey: "",
            timer: "",
            surveyLoading: true,
            errore: false,
            buttonReady: false,
            formatTimer: "",
            shouldRenderTime: false,
            idUpdate:"",
        };
    }

    componentDidMount() {
        const queryParameters = new URLSearchParams(window.location.search)
        const tokenId = queryParameters.get("tokenId")
        console.log(tokenId)

        fetch(Environment.APPLICATION_BACKEND_PREFIX_URL + 'survey/getSurveyForCandidate/' + tokenId).then(response => response.json())
            .then(responseData => {
                this.setState({
                    questions: responseData.questions,
                    survey: responseData,
                    timer: responseData.time * 60,
                    surveyLoading: false
                })
            })
            .catch(err => {
                console.error(err)
                window.alert(`Error loading survey: ${err.message}`)
                this.setState({ error: true, surveyLoading: false })
            });
    }

    createSurveyreplies = () => {
        console.log("createSurveyreplies")
        const item = {
            surveyId: this.state.survey.surveyId,
            userTokenId: this.state.survey.candidateTokenId,
            candidateId: this.state.survey.candidateId
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        };
        fetch(Environment.APPLICATION_BACKEND_PREFIX_URL + 'surveyreplyrequest/start/', requestOptions)
        .then(response => {
            if (response.status === 201) {
                return response.json();
            } else {
                console.log(response.status);
            }
        })
        .then(data => {
            console.log("risposta del json: " + JSON.stringify(data));
            this.setState({
                idUpdate : data.id
            })
        })
    }

    getButtons() {
        console.log("getButtons")
        const button = []
        const numSlides = document.getElementsByClassName("slide").length;
        for (let i = 0; i < numSlides; i++) {
            var idButton = 'Button' + (i + 1);
            button.push(<Button variant="outline-secondary" id={idButton} onClick={() => this.handleSelectedSlide(i)}>{i + 1}</Button>)
        }
        if (numSlides > 0 && this.state.buttonReady === false) {
            console.log("sono maggiore di zero")
            this.setState({
                buttonReady: true
            });
        }
        return button;
    }

    highlightButton(index) {
        var indexButtons = document.getElementById("indexButton").children
        for (var i = 0; i < indexButtons.length; i++) {
            var buttonChild = indexButtons[i];
            buttonChild.setAttribute("class", "btn btn-outline-secondary")
        }
        var button = document.getElementById("Button" + (index + 1))
        button.setAttribute("class", "btn btn-dark")

    }

    handleNextSlide = () => {
        console.log("handleNextSlide")
        const numSlides = document.getElementsByClassName("slide").length;
        if (this.state.currentSlide !== numSlides - 1) {
            const nextSlide = this.state.currentSlide + 1;
            document.getElementsByClassName("slide")[this.state.currentSlide].style.display = "none";
            document.getElementsByClassName("slide")[nextSlide].style.display = "block";
            this.setState({ currentSlide: nextSlide });
            this.highlightButton(nextSlide)
            if (this.state.currentSlide === numSlides - 2) {
                document.getElementsByClassName("sendSurvey")[0].style.display = "block";
            }
        };
    }

    handlePrevSlide = () => {
        console.log("handlePrevSlide")
        const numSlides = document.getElementsByClassName("slide").length;
        if (this.state.currentSlide !== 0) {
            const prevSlide = this.state.currentSlide - 1;
            document.getElementsByClassName("slide")[this.state.currentSlide].style.display = "none";
            document.getElementsByClassName("slide")[prevSlide].style.display = "block";
            this.setState({ currentSlide: prevSlide });
            this.highlightButton(prevSlide)
            if (this.state.currentSlide !== numSlides - 2) {
                document.getElementsByClassName("sendSurvey")[0].style.display = "none";
            }
        }
    };

    handleSelectedSlide = index => {
        console.log("handleSelectedSlide " + index)
        const numSlides = document.getElementsByClassName("slide").length;
        document.getElementsByClassName("slide")[this.state.currentSlide].style.display = "none";
        document.getElementsByClassName("slide")[index].style.display = "block";
        this.setState({ currentSlide: index });
        this.highlightButton(index)
        if (index === numSlides - 1) {
            document.getElementsByClassName("sendSurvey")[0].style.display = "block";
        } else {
            document.getElementsByClassName("sendSurvey")[0].style.display = "none";
        }
    };

    startSurvey = () => {
        console.log("startSurvey")
        document.getElementsByClassName("start")[0].style.display = "none";
        document.getElementsByClassName("movementButtons")[0].style.display = "block";
        document.getElementsByClassName("slide")[0].style.display = "block";
        this.setState({ shouldRenderTime: true })
    };

    sendSurvey = () => {
        const numSlides = document.getElementsByClassName("slide").length;
        var checkDiv = "";
        var checkboxes = [];
        var jsonArrayResponse = [];

        for (let i = 0; i < numSlides; i++) {
            var jsonResponse = {};
            checkDiv = document.getElementById(i)
            checkboxes = checkDiv.getElementsByTagName("input")
            jsonResponse.questionId = checkDiv.getAttribute("name")
            for (let i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    this.switchResponse(i, "true", jsonResponse)
                }
                else {
                    this.switchResponse(i, "false", jsonResponse)
                }
            }

            jsonArrayResponse.push(jsonResponse)
        }

        const item = {
            surveyId: this.state.survey.surveyId,
            userTokenId: this.state.survey.candidateTokenId,
            candidateId: this.state.survey.candidateId,
            answers : jsonArrayResponse,
        };

        console.log(jsonArrayResponse)

        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        };
        const id = this.state.idUpdate
        fetch(Environment.APPLICATION_BACKEND_PREFIX_URL + 'surveyreplyrequest/end/'+ id, requestOptions)
            .then(response => {
                if (response.status === 200) {
                    response.json()
                    this.completeQuestion()
                } else {
                    console.log(response.status);
                }
            })
    }

    completeQuestion = () => {
        document.getElementsByClassName("sendSurvey")[0].style.display = "none";
        document.getElementsByClassName("movementButtons")[0].style.display = "none";
        document.getElementsByClassName("questionComplete")[0].style.display = "block";
        document.getElementsByClassName("slide")[0].style.display = "none";
        document.getElementsByClassName("list")[0].style.display = "none";
        this.setState({shouldRenderTime:false})
    }

    switchResponse(index, value, jsonResponse) {
        switch (index) {
            case 0: jsonResponse.cansa = value
                break;
            case 1: jsonResponse.cansb = value
                break;
            case 2: jsonResponse.cansc = value
                break;
            case 3: jsonResponse.cansd = value
                break;
            case 4: jsonResponse.canse = value
                break;
            case 5: jsonResponse.cansf = value
                break;
            case 6: jsonResponse.cansg = value
                break;
            case 7: jsonResponse.cansh = value
                break;
            default: ;
        }
    }

    render() {
        const { surveyLoading, error, shouldRenderTime } = this.state;

        if (surveyLoading) {
            return <LoadingSpinnerComponent />
        }

        if (error) {
            return <div>Error loading survey</div>;
        }

        const list = this.state.questions.map((element, i) => {
            return (

                <div id={i} name={element.id} className="slide" style={{ display: "none" }}>
                    <p>Question: {i + 1}</p>
                    <div>
                        <h4>{element.label}</h4>
                    </div>
                    {element.ansa !== null ?
                        <div>
                            <span><input id="ansa" type="checkbox" /></span>
                            <span>{element.ansa}</span>
                        </div>
                        : null}
                    {element.ansb !== null ?
                        <div>
                            <span><input id="ansb" type="checkbox" /></span>
                            <span>{element.ansb}</span>
                        </div>
                        : null}
                    {element.ansc !== null ?
                        <div>
                            <span><input id="ansc" type="checkbox" /></span>
                            <span>{element.ansc}</span>
                        </div>
                        : null}
                    {element.ansd !== null ?
                        <div>
                            <span><input id="ansd" type="checkbox" /></span>
                            <span>{element.ansd}</span>
                        </div>
                        : null}
                    {element.anse !== null ?
                        <div>
                            <span><input id="anse" type="checkbox" /></span>
                            <span>{element.anse}</span>
                        </div>
                        : null}
                    {element.ansf !== null ?
                        <div >
                            <span><input id="ansf" type="checkbox" /></span>
                            <span>{element.ansf}</span>
                        </div>
                        : null}
                    {element.ansg !== null ?
                        <div >
                            <span><input id="ansg" type="checkbox" /></span>
                            <span>{element.ansg}</span>
                        </div>
                        : null}
                    {element.ansh !== null ?
                        <div >
                            <span><input id="ansh" type="checkbox" /></span>
                            <span>{element.ansh}</span>
                        </div>
                        : null}
                </div>
            )
        },
        )
        return (
            <div align="center">
                <div id="start" className="start">
                    <h1>Corso Full Stack Developer.</h1>
                    <h2>Questionario d'ingresso.</h2>
                    <br />
                    <p>
                        Gentile candidato, questa ?? la pagina di presentazione del questionario d'ingresso utile per la partecipazione al prossimo
                        corso Full Stack Developer in partenza.
                        <br /> La preghiamo di compilare il questionario in base alle sue attuali conoscenze. Questo
                        ci permetter?? di avere idea delle sue attuali competenze, e poter quindi, organizzare al meglio il corso stesso.
                    </p>
                    <p>
                        Attenzione, il questionario va terminato entro il tempo massimo che vedr?? in alto a sinistra, una volta iniziata la compilazione.
                        <br />Clicchi sul link qui in basso solo quando effettivamente vorr?? compilare il questionario.
                        <br />Avr?? solo una possibilit?? di compilare il questionario.
                    </p>
                    <br />
                    <Button disabled={!this.state.buttonReady} id="startSurvey" variant="dark" onClick={() => { this.startSurvey(); this.createSurveyreplies(); this.highlightButton(0); }}>Inizia il questionario</Button>
                </div>
                <div className="questionComplete" style={{ display: "none" }} >
                    Questionario Inviato
                </div>
                <div className="list" style={{ display: "block" }}>
                {list}
                </div>
                <ButtonToolbar className="movementButtons" style={{ display: "none" }}>
                    <ButtonGroup className="me-2" aria-label="First group">
                        <Button variant="dark" onClick={this.handlePrevSlide}>Indietro</Button>
                    </ButtonGroup>
                    <ButtonGroup id="indexButton" className="me-2" aria-label="Second group">
                        {this.getButtons()}
                    </ButtonGroup>
                    <ButtonGroup>
                        <Button variant="dark" className="me-2" onClick={this.handleNextSlide}>Avanti</Button>
                    </ButtonGroup>
                </ButtonToolbar>
                <h3 className="time">
                    {shouldRenderTime && <Timer duration={this.state.timer} sendSurveyProp={this.sendSurvey} />}
                </h3>
                <br />
                <br />
                <br />
                <Button className="sendSurvey" variant="danger" size="lg" onClick={this.sendSurvey} style={{ display: "none" }}>
                    Invia il questionario
                </Button>
            </div>
        )
    }
}
export default Surveys;