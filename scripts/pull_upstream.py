import requests
import zipfile
import io
import json
from pathlib import Path


# Ensure the technologies directory exists
code_dir = Path(__file__).parent.parent
local_fingerprint_dir = code_dir / "src" / "technologies"
local_fingerprint_dir.mkdir(parents=True, exist_ok=True)

chrome_extension_url = "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=119.0.6045.199&acceptformat=crx2,crx3&x=id%3Dgppongmhjkpfnbhagpmjfkannfbllamg%26installsource%3Dondemand%26uc"


def download_and_extract_fingerprints():
    # Download the CRX file
    resp = requests.get(chrome_extension_url)
    resp.raise_for_status()  # Raises stored HTTPError, if one occurred.

    # Read the content into a byte slice
    body = resp.content

    # Read the CRX file without writing to disk
    zip_reader = zipfile.ZipFile(io.BytesIO(body), 'r')

    # Iterate through the files in the zip archive
    for file in zip_reader.namelist():
        if file.startswith("technologies/") and file.endswith(".json"):
            print(f"Extracted {file}")

            # Open the file from the zip
            with zip_reader.open(file) as f:
                # Read fingerprints from file
                upstream_fingerprints = json.load(f)

                # Path for the local file
                local_file_path = local_fingerprint_dir / Path(file).name
                # Ensure local file exists
                local_file_path.touch()
                local_fingerprints = {}

                with open(local_file_path, 'r+', encoding='utf-8') as local_file:
                    # Read the local JSON file
                    local_fingerprints = json.load(local_file)
                    # Update local_data with the new fingerprints
                    local_fingerprints.update(upstream_fingerprints)
                    # Write the updated data back
                    local_file.seek(0)  # Go to the beginning of the file
                    json.dump(local_fingerprints, local_file, indent=2, sort_keys=True)
                    local_file.truncate()  # Remove the remaining part of the old content

download_and_extract_fingerprints()
print("Fingerprints updated successfully.")