import subprocess

import torch
import torch.cuda

from workers.celery import celery_app


@celery_app.task(name="training", queue="tra_queue")
def training_task(command, output_dir, gpu_device, cost, model):
    try:
        training_process = subprocess.Popen(command)
        training_process.wait()
        message = "Process completed successfully" if training_process.returncode == 0 else f"Error: Process exited with code {training_process.returncode}"
        torch.cuda.empty_cache()
        return message
    except subprocess.CalledProcessError as e:
        return f"Error occurred while executing command: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"
