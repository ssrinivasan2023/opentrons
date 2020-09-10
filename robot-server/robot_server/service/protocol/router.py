import logging
import typing

from starlette import status as http_status_codes
from fastapi import APIRouter, UploadFile, File, Depends, Body

from robot_server.service.json_api import ResourceLink
from robot_server.service.json_api.resource_links import ResourceLinkKey
from robot_server.service.protocol import models as route_models
from robot_server.service.dependencies import get_protocol_manager
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.protocol.protocol import UploadedProtocol

log = logging.getLogger(__name__)


router = APIRouter()


@router.post("/protocols",
             description="Create a protocol",
             response_model_exclude_unset=True,
             response_model=route_models.ProtocolResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol(
        protocolFile: UploadFile = File(..., description="The protocol file"),
        supportFiles: typing.List[UploadFile] = Body(
            default=list(),
            description="Any support files needed by the protocol (ie data "
                        "files, additional python files)"),
        protocol_manager=Depends(get_protocol_manager)):
    """Create protocol from proto file plus optional support files"""
    new_proto = protocol_manager.create(protocol_file=protocolFile,
                                        support_files=supportFiles,)
    return route_models.ProtocolResponse(
        data=_to_response(new_proto),
        links={
            ResourceLinkKey.self: ResourceLink(
                href=router.url_path_for(get_protocol.__name__,
                                         protocolId=new_proto.meta.identifier))
        }
    )


@router.get("/protocols",
            description="Get all protocols",
            response_model_exclude_unset=True,
            response_model=route_models.MultiProtocolResponse)
async def get_protocols(
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    return route_models.MultiProtocolResponse(
        data=[_to_response(u) for u in protocol_manager.get_all()],
        links={
            ResourceLinkKey.self:
                ResourceLink(href=router.url_path_for(get_protocols.__name__))
        }
    )


@router.get("/protocols/{protocolId}",
            description="Get a protocol",
            response_model_exclude_unset=True,
            response_model=route_models.ProtocolResponse)
async def get_protocol(
        protocolId: str,
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    proto = protocol_manager.get(protocolId)
    return route_models.ProtocolResponse(
        data=_to_response(proto),
        links={
            ResourceLinkKey.self:
                ResourceLink(href=router.url_path_for(
                    get_protocol.__name__, protocolId=proto.meta.identifier)
                )
        })


@router.delete("/protocols/{protocolId}",
               description="Delete a protocol",
               response_model_exclude_unset=True,
               response_model=route_models.ProtocolResponse)
async def delete_protocol(
        protocolId: str,
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    proto = protocol_manager.remove(protocolId)
    return route_models.ProtocolResponse(
        data=_to_response(proto),
        links={
            ResourceLinkKey.self:
                ResourceLink(href=router.url_path_for(get_protocols.__name__))
        }
    )


@router.post("/protocols/{protocolId}",
             description="Add a file to protocol",
             response_model_exclude_unset=True,
             response_model=route_models.ProtocolResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol_file(
        protocolId: str,
        file: UploadFile = File(...),
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    proto = protocol_manager.get(protocolId)
    proto.add(file)
    return route_models.ProtocolResponse(
        data=_to_response(proto),
        links={
            ResourceLinkKey.self: ResourceLink(
                href=router.url_path_for(get_protocol.__name__,
                                         protocolId=proto.meta.identifier))
        }
    )


def _to_response(uploaded_protocol: UploadedProtocol) \
        -> route_models.ProtocolResponseDataModel:
    """Create ProtocolResponse from an UploadedProtocol"""
    meta = uploaded_protocol.meta
    return route_models.ProtocolResponseDataModel.create(
        attributes=route_models.ProtocolResponseAttributes(
            protocolFile=route_models.FileAttributes(
                basename=meta.protocol_file.path.name
            ),
            supportFiles=[route_models.FileAttributes(
                basename=s.path.name
            ) for s in meta.support_files],
            lastModifiedAt=meta.last_modified_at,
            createdAt=meta.created_at
        ),
        resource_id=meta.identifier
    )
