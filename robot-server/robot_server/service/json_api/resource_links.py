import typing
from enum import Enum
from pydantic import BaseModel, Field


class ResourceLink(BaseModel):
    """https://jsonapi.org/format/#document-links"""
    href: str = \
        Field(...,
              description="The link’s URL")
    meta: typing.Optional[typing.Dict[typing.Any, typing.Any]] = \
        Field(None, description="Meta data about the link")


class ResourceLinkKey(str, Enum):
    # The key indicating the link to own resource
    self = "self"


ResourceLinks = typing.Dict[str, ResourceLink]
