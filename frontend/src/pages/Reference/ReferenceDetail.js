import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from "react-syntax-highlighter";
import {dark} from "react-syntax-highlighter/src/styles/hljs";
import ReactMarkdown from "react-markdown";
import ReferenceSidebar from "./component/ReferenceSidebar";
import {customAxios} from "../../Common/Modules/CustomAxios";
import {decodeToken} from "react-jwt";
import ScrollToTop from "../../Common/Modules/ScrollToTop";

function ReferenceDetail(props) {
    const {id} = useParams();
    const [referenceDetail, setReferenceDetail] = useState({});
    const [preDetail, setPreDetail] = useState(null);
    const [nextDetail, setNextDetail] = useState(null);
    const navigate = useNavigate();
    const buttonStyle = { marginLeft:"5px", fontSize:"14px"}
    const [titles, setTitles] = useState(useLocation().state); //목차 전달을 위함
    const role = (localStorage.getItem("refresh") === null ? null : (decodeToken(localStorage.getItem("refresh")).role));

    useEffect( () => {
    const getReferenceDetail = async (nextSub, preSub) => {
        let referenceDetail = await customAxios.get(`/reference/${id}`);
        // console.log(referenceDetail);
        referenceDetail = referenceDetail.data.data;        
        setReferenceDetail({...referenceDetail.ref});
        setNextDetail(referenceDetail.nextRef && {...referenceDetail.nextRef});
        setPreDetail(referenceDetail.preRef && {...referenceDetail.preRef});
        }    
        getReferenceDetail(nextDetail, preDetail);
    }, [id]);

    const updateDetail = () => {
        navigate(`/reference/${referenceDetail.id}/update`, {state: {referenceDetail : referenceDetail}});
    }
    const deleteDetail = () => {
        customAxios.delete(`/reference/${referenceDetail.id}`
        ).then(function(response) {
            alert(response.data.data);
            navigate(-1);
        })
    }
    const createReference = () => {
        navigate("/reference/create");
    }

    const goPre = () => {
        navigate(`/reference/${preDetail.id}`);
    }
    const goNext = () => {
        navigate(`/reference/${nextDetail.id}`);
    }


    return (
        <>
            <ScrollToTop />
            <div id="page-wrapper">
                <ReferenceSidebar titles={titles} />
                <div id="page-content-wrapper">
                    <div className="col-8 mx-auto m-3 p-2">
                        <br/>
                        <h1>{referenceDetail.name}</h1>
                    </div>
                    {
                        (role === "ROLE_ADMIN" || role === "ROLE_MANAGER") &&
                        <div className="col-4 ms-auto m-1">
                            <Button onClick={createReference}>레퍼런스 추가</Button> {/*//TODO 관리자만 사용 가능하게 추후 변경*/}
                            <Button variant="warning" style={buttonStyle} onClick={updateDetail}>수정</Button>
                            <Button variant="danger" style={buttonStyle} onClick={deleteDetail}>삭제</Button>
                        </div>
                    }


                    <div className="col-8 mx-auto border-top border-bottom m-3 p-2">
                        <ReactMarkdown children={referenceDetail.content}
                                       remarkPlugins={[remarkGfm]}
                                       components={{
                                           code({node, inline, className, children, ...props}) {
                                               const match = /language-(\w+)/.exec(className || '')
                                               return !inline && match ? (
                                                   <SyntaxHighlighter
                                                       children={String(children).replace(/\n$/, '')}
                                                       style={dark}
                                                       language={match[1]}
                                                       PreTag="div"
                                                       {...props}
                                                   />
                                               ) : (
                                                   <code className={className} {...props}>
                                                       {children}
                                                   </code>
                                               )
                                           }
                                       }}/>
                    </div> {/*TODO: 마크다운으로 받도록 수정*/}
                    <br/>
                    <div className="col-8 mx-auto">
                        <div className=" nav justify-content-between">
                            {preDetail ? <Button style={buttonStyle} onClick={goPre}>Prev</Button> : <Button variant="secondary" style={buttonStyle} disabled>Prev</Button>}
                            {nextDetail ? <Button style={buttonStyle} onClick={goNext}>Next</Button> : <Button variant="secondary" style={buttonStyle} disabled>Next</Button>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ReferenceDetail;
