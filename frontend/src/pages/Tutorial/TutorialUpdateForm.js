import {useState} from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { customAxios } from "../../Common/Modules/CustomAxios";
import {EXERCISE_TAG} from "../../Common/Modules/Common";
import TutorialRelationCheckUpdate from "./components/TutorialRelationCheckUpdate";

function TutorialUpdateForm() {
    const {tutorial} = useLocation().state;
    const [loading,setLoading] = useState(false);
    const { register, handleSubmit, formState: {errors} } = useForm();
    const navigate = useNavigate();

    const [checkAll,setCheckAll] = useState(false);
    const [checkedList] = useState(new Set());

    const onSubmit = (data) => {
        setLoading(true);
        data.number = data.number * 1;
        data.checkedList = [];
        checkedList.forEach((elem)=>{data.checkedList.push(elem)})
        customAxios.patch(`/tutorial/${tutorial.id}`, {...data})
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
            alert(Error.response.status + "error");
        })
    }

    const checkedRelationsHandler = (id,checked) => {
        if(checked === true)
        {
            checkedList.add(id);
        }
        else if(checked === false && checkedList.has(id) === true)
        {
            checkedList.delete(id);
        }
    }

    const checkAllHandler = () => {
        setCheckAll(!checkAll);
    }

    return (
        <>
            <Container>
                <h3 className="text-black mt-5 p-3 text-center rounded">대주제 수정하기</h3>
                <Row className="mt-7">
                    <Col lg={7} md={10} sm={12} className="p-5 m-auto shadow-sm rounded-lg">
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            <Form.Group className="mb-3" controlId="tutorialNumber">
                                <Form.Label>번호</Form.Label>
                                <Form.Control placeholder="번호를 입력하세요" defaultValue={tutorial.number} {...register("number",  {required: {value:true, message:"*번호를 입력하세요"} , pattern: {value: /^[0-9]+$/, message:"*번호는 숫자만 가능합니다"}})} />
                                {errors.number && <p style={{color:'red', fontSize:"13px"}}>{errors.number.message}</p>}
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="tutorialTitle">
                                <Form.Label>제목</Form.Label>
                                <Form.Control type="title" placeholder="제목을 입력하세요" defaultValue={tutorial.name} {...register("name",  {required: {value:true, message:"*제목를 입력하세요"}})} />
                                {errors.name && <p style={{color:'red', fontSize:"13px"}}>{errors.name.message}</p>}
                            </Form.Group>

                            <Form.Group>
                                <div className="mb-2">태그</div>
                                <span className="mb-3">
                                    <Form.Check
                                        inline
                                        label={'전체'}
                                        checked={checkAll}
                                        type={'checkbox'}
                                        id={'all'}
                                        onChange={(e)=>{checkAllHandler(e)}}
                                    />
                                </span>
                                {EXERCISE_TAG.map((elem)=>(
                                    <span key={`checkbox-${elem}`} className="mb-3">
                                        <TutorialRelationCheckUpdate id={elem} checkedRelationsHandler={checkedRelationsHandler} checkAll={checkAll} checkedRelations={tutorial.tutorialRelations}/>
                                    </span>
                                ))}
                            </Form.Group>
                            <br/>

                           <Button type="submit" disabled={loading}>제출하기</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default TutorialUpdateForm;

