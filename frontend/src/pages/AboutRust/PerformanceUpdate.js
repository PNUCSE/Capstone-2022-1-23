import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { EditorState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { stateFromMarkdown } from "draft-js-import-markdown";
import { stateToMarkdown } from "draft-js-export-markdown";
import { customAxios } from "../../Common/Modules/CustomAxios";

function PerformanceUpdate() {
    const {aboutRust, input} = useLocation().state;
    const [loading,setLoading] = useState(false);
    const { register, handleSubmit, formState: {errors} } = useForm();
    const navigate = useNavigate();
    const onSubmit = (data) => {
        setLoading(true);
        aboutRust.content = data.code;
        customAxios.patch(`/aboutRust`, {...aboutRust})
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

            input.content = data.input
            customAxios.patch(`/aboutRust`, {...input})
            .then((response) => 
            {
                if (response.data.code === 200)
                {
                    alert(response.data.data);
                }
            })
            .catch((Error) => 
            {
                alert(Error.response.status + " error");
            })
    }

    return (
        <>
            <Container>
                <h3 className="text-black mt-5 p-3 text-center rounded">{aboutRust.aboutType} 수정하기</h3>
                <Row className="mt-7">
                    <Col lg={7} md={10} sm={12} className="p-5 m-auto shadow-sm rounded-lg">
                        <Form onSubmit={handleSubmit(onSubmit)} >
                            <Form.Label>Content</Form.Label>
                            <Form.Control as="textarea" rows="3" defaultValue={aboutRust?.content} {...register("code")}/>
                            <br/>
                            <Form.Label>Input</Form.Label>
                            <Form.Control as="textarea" rows="3" defaultValue={input?.content} {...register("input")}/>
                            <br/>
                           <Button type="submit" disabled={loading}>제출하기</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default PerformanceUpdate;