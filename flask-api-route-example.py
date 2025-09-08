import json
import time
import random

from fastapi import Depends, APIRouter, HTTPException, Security, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from google.cloud import documentai_v1 as documentai
from google.oauth2.service_account import Credentials
from google.api_core.client_options import ClientOptions

from shared.ai import ai_step
from shared.util import default_session, permit, user_tag, user_tag_add_one
from shared.models import Provider


router = APIRouter(
    prefix="/data",
    tags=["data"],
    redirect_slashes=False
)


@router.post("/ocr", status_code=200)
def ocr(
    file: UploadFile,
    token: HTTPAuthorizationCredentials = Security(HTTPBearer()),
    db_session: Session = Depends(default_session),
):
    with db_session as db:
        # User auth.
        user = permit(db, token.credentials)

        if not user.is_superadmin:
            if user_tag(user, "count_ocr_executions", int, 0) >= 3:
                time.sleep(random.uniform(0.0, 1.0))
                raise HTTPException(status_code=400,
                                    detail=f"Too many OCR requests. Limited 3 per free user.")
            
        # Prepare GCP credentials.
        provider = db.query(Provider).filter(Provider.slug == "default").one_or_none()
        credentials = Credentials.from_service_account_info(
            info=provider.credentials,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Prepare SDK client and some reusable variables.
        location = "us"
        project_id = provider.credentials.get("project_id")
        client_options = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
        client = documentai.DocumentProcessorServiceClient(
            client_options=client_options,
            credentials=credentials
        )
        parent = f"projects/{project_id}/locations/{location}"
        default_processor_name = "default_ocr_processor"
        processor_type = "OCR_PROCESSOR"

        # Get or create the Document AI processor.
        # https://cloud.google.com/document-ai/docs/create-processor
        # https://cloud.google.com/document-ai/docs/samples/documentai-create-processor
        foundProcessorId = None
        processors = client.list_processors(parent=parent)
        for processor in processors:
            if processor.display_name == default_processor_name:
                foundProcessorId = processor.name.split('/')[-1]
                print(f"Found Processor '{default_processor_name}' with ID: {foundProcessorId}")
                break
        
        if foundProcessorId is None:
            print(f"Creating processor '{default_processor_name}' with type '{processor_type}'")
            processor = documentai.Processor(
                display_name=default_processor_name,
                type_=processor_type
            )

            response = client.create_processor(parent=parent, processor=processor)
            foundProcessorId = response.name.split('/')[-1]
            print(f"Created Processor '{default_processor_name}' with ID: {foundProcessorId}")

        # Process the document.
        # https://cloud.google.com/document-ai/docs/file-types
        # https://cloud.google.com/document-ai/docs/reference/rest/v1/Document
        name = client.processor_path(project_id, location, foundProcessorId)
        raw_document = documentai.RawDocument(content=file.file.read(), mime_type=file.content_type)
        request = documentai.ProcessRequest(name=name, raw_document=raw_document)
        result = client.process_document(request=request)

        # Debugging the API scheme from DocumentAI.
        print(json.dumps(result.document.entities, indent=4, default=str), flush=True)

        lines = result.document.text.split("\n")

        # GPT-4o Step
        result = ai_step(f"""
Here's the raw data extracted from an OCR API:

{json.dumps(lines, indent=4)}

Please clean up the data and intuitively provide key-value pairs based on the data. Respond with a raw JSON object containing string keys and string value pairs. No other formatting characters.
""", print)

        # Cleanup the result just in-case.
        if result.startswith("```json"):
            result = result[7:]
            result = result[:result.rfind("```")]
        elif result.startswith("```"):
            result = result[3:]
            result = result[:result.rfind("```")]

        user_tag_add_one(db, user, "count_ocr_executions")

        return json.loads(result)
