import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { customAxios } from "../../Common/Modules/CustomAxios";

function TutorialQuizCreateForm() {
    const {tutorial} = useLocation().state;
    const [loading,setLoading] = useState(false);
    const [numbers, setNumbers] = useState([1 ]);
    const { register, handleSubmit, formState: {errors}, reset } = useForm();
    const navigate = useNavigate();
    const buttonStyle = { marginLeft:"5px", fontSize:"14px"}

    const onSubmit = (data) => {
        setLoading(true);
        data.tutorialQuizQuestions = data.tutorialQuizQuestions.slice(0, numbers.length);
        customAxios.post(`/tutorial/${tutorial.id}/quiz`, {...data})
        .then((response) =>
        {
            if (response.data.code === 200)
            {
                alert(response.data.data);
            }
            navigate(-1);
        })
        .catch((Error) =>
        {
            alert(Error.response.status + " error");
        })
    }
    const addQuestion = () => {
        setNumbers([...numbers, `${numbers.length + 1}`]);
    }
    const removeQuestion = () => {
        setNumbers(numbers.slice(0, numbers.length - 1));
    }

    const questions = numbers.map((number, index) => {
        return (
            <Form.Group key={index} className="mb-3" controlId="questions">
                <Form.Label>문제{number}</Form.Label>
                <Form.Control type="hidden"  value={index} {...register("tutorialQuizQuestions["+index+"].number")} />                
                <Form.Control type="title" as="textarea" placeholder="문제 제목을 입력하세요" {...register(`tutorialQuizQuestions[${index}].title`, {required: true})} />
                <Form.Control placeholder="1번 보기를 입력하세요" defaultValue={"1. "} {...register(`tutorialQuizQuestions[${index}].choice1`,  {required: true})} />
                <Form.Control placeholder="2번 보기를 입력하세요" defaultValue={"2. "} {...register(`tutorialQuizQuestions[${index}].choice2`,  {required: true})} />
                <Form.Control placeholder="3번 보기를 입력하세요" defaultValue={"3. "} {...register(`tutorialQuizQuestions[${index}].choice3`,  {required: true})} />
                <Form.Control placeholder="4번 보기를 입력하세요" defaultValue={"4. "} {...register(`tutorialQuizQuestions[${index}].choice4`,  {required: true})} />
                <Form.Control type="number" placeholder="정답 번호를 입력하세요" {...register(`tutorialQuizQuestions[${index}].answer`, {valueAsNumber: true, required: true})} />    
                <br/>
            </Form.Group>
        )
    })
    
    return (
        <>
            <Container>
                <h3 className="text-black mt-5 p-3 text-center rounded">퀴즈 추가하기</h3>
                <Row className="mt-7">
                    <Col lg={7} md={10} sm={12} className="p-5 m-auto shadow-sm rounded-lg">
                        <Form onSubmit={handleSubmit(onSubmit)} onReset={reset} >                            
                            <Form.Group className="mb-3" controlId="tutorialTitle">
                                <Form.Label>제목</Form.Label>
                                <Form.Control type="title" placeholder="제목을 입력하세요" {...register("name",  {required: {value:true, message:"*제목를 입력하세요"}})} />
                                {errors.name && <p style={{color:'red', fontSize:"13px"}}>{errors.name.message}</p>}
                            </Form.Group>
                            {questions}
                            <Button onClick={ addQuestion } style={buttonStyle}>Question 추가하기</Button>
                            <Button onClick={ removeQuestion } style={buttonStyle}>Question 삭제하기</Button>
                            <br/><br/>
                           <Button type="submit" style={buttonStyle} disabled={loading}>제출하기</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default TutorialQuizCreateForm;